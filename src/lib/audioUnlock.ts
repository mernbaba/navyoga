// Mobile browsers (iOS Safari, Android Chrome) block autoplay of media that
// has sound until the user performs a gesture on the page. WebRTC remote audio
// is exactly this case: a programmatically-bound <audio srcObject> often stays
// paused on a phone even though `autoPlay` is set, which presents as "audio
// from this device isn't reaching the phone" (the phone never starts playback).
//
// This module keeps a registry of remote media elements and AudioContexts and
// (a) tries to play/resume them immediately, and (b) retries every registered
// element on the first user gesture, after which autoplay is unlocked for the
// rest of the session.

const mediaElements = new Set<HTMLMediaElement>();
const audioContexts = new Set<AudioContext>();
const subscribers = new Set<() => void>();
let listenersAttached = false;
let unlocked = false;

const GESTURE_EVENTS: Array<keyof DocumentEventMap> = [
  "click",
  "touchend",
  "touchstart",
  "keydown",
  "pointerdown",
];

const playElement = (el: HTMLMediaElement): void => {
  const result = el.play();
  // Older browsers return undefined from play(); only newer ones return a
  // Promise we can catch. Swallow rejections — a blocked play is retried on
  // the next gesture, not a fatal error.
  if (result && typeof result.catch === "function") {
    result.catch(() => undefined);
  }
};

const resumeContext = (ctx: AudioContext): void => {
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => undefined);
  }
};

const flushAll = (): void => {
  mediaElements.forEach(playElement);
  audioContexts.forEach(resumeContext);
};

const markUnlocked = (): void => {
  // Always flush (a later gesture can re-kick an element the browser paused),
  // but only fire subscribers on the first transition so the overlay hides
  // exactly once.
  flushAll();
  if (unlocked) return;
  unlocked = true;
  subscribers.forEach((fn) => fn());
};

const onGesture = (): void => {
  markUnlocked();
};

const attachListeners = (): void => {
  if (listenersAttached || typeof document === "undefined") return;
  listenersAttached = true;
  GESTURE_EVENTS.forEach((evt) => {
    document.addEventListener(evt, onGesture, { passive: true });
  });
};

/**
 * Register a remote media element so its playback is (re)attempted now and on
 * the next user gesture. Returns an unregister function for cleanup.
 */
export const registerRemoteMedia = (el: HTMLMediaElement): (() => void) => {
  mediaElements.add(el);
  attachListeners();

  // Retry play() at the moments the element actually becomes playable. iOS
  // Safari frequently defers a programmatic play() until media data arrives;
  // a remote WebRTC track that unmutes mid-call (e.g. the other side flips
  // track.enabled from false to true) surfaces as one of these events, not as
  // a fresh element. Re-attempting here is what makes a delayed unmute audible
  // without requiring the user to tap again.
  const retry = () => playElement(el);
  el.addEventListener("loadedmetadata", retry);
  el.addEventListener("canplay", retry);
  // If the browser auto-pauses the element (autoplay block, focus loss), try
  // to resume it. Guard with `ended` so we don't fight a genuinely finished
  // element — remote streams never "end" on their own, so any pause is one we
  // want to undo.
  const onPause = () => {
    if (!el.ended) playElement(el);
  };
  el.addEventListener("pause", onPause);

  // Attempt immediately — on desktop this just works; on mobile it may be
  // blocked and will be retried on the first gesture (or right away if the
  // user has already interacted this session).
  playElement(el);

  return () => {
    mediaElements.delete(el);
    el.removeEventListener("loadedmetadata", retry);
    el.removeEventListener("canplay", retry);
    el.removeEventListener("pause", onPause);
  };
};

/**
 * Register an AudioContext (e.g. the active-speaker analyser) so it is resumed
 * on the first user gesture — mobile starts AudioContexts suspended.
 */
export const registerAudioContext = (ctx: AudioContext): (() => void) => {
  audioContexts.add(ctx);
  attachListeners();
  resumeContext(ctx);
  return () => {
    audioContexts.delete(ctx);
  };
};

/** Whether a user gesture has already unlocked autoplay this session. */
export const isAudioUnlocked = (): boolean => unlocked;

/**
 * Explicitly unlock audio in response to a user gesture (e.g. the "tap to
 * enable audio" overlay button). Safe to call repeatedly; only the first call
 * flips state and notifies subscribers. Because it runs inside the gesture's
 * call stack, the play()/resume() it triggers count as user-initiated.
 */
export const unlockAudio = (): void => {
  markUnlocked();
};

/**
 * Subscribe to unlock-state changes (for useSyncExternalStore). The callback
 * fires once, when audio transitions to unlocked. Returns an unsubscribe fn.
 */
export const subscribeAudioUnlock = (callback: () => void): (() => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

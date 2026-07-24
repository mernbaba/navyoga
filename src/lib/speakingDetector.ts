// Voice-activity detection shared by every tile in the room.
//
// One AudioContext for the whole page, one analyser per MediaStream, one timer
// driving them all. This matters: browsers cap the number of live AudioContexts
// (~6 in Chrome, after which `new AudioContext()` throws), so the old
// one-context-per-participant approach silently stopped detecting anyone past
// the sixth peer in a full class.
//
// Watchers are keyed by stream, so a tile and the meeting context observing the
// same participant share a single analyser instead of doubling the work.

import { registerAudioContext } from "@/lib/audioUnlock";

// Average byte level (0-255 over the frequency bins) that counts as speech.
// Two thresholds give hysteresis so a voice hovering near the line doesn't make
// the indicator flicker on and off.
const LEVEL_ON = 18;
const LEVEL_OFF = 12;
// Keep the indicator lit briefly through the natural gaps between words.
const RELEASE_MS = 700;
const POLL_MS = 150;

type Listener = (speaking: boolean) => void;

type Watcher = {
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  data: Uint8Array<ArrayBuffer>;
  listeners: Set<Listener>;
  speaking: boolean;
  lastLoudAt: number;
};

const watchers = new Map<MediaStream, Watcher>();
let sharedCtx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

const getContext = (): AudioContext | null => {
  if (sharedCtx) return sharedCtx;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  try {
    sharedCtx = new Ctx();
    // Mobile starts AudioContexts suspended until a user gesture; register so
    // it resumes on first interaction (otherwise the analyser never ticks).
    registerAudioContext(sharedCtx);
    return sharedCtx;
  } catch {
    return null;
  }
};

const tick = (): void => {
  const now = performance.now();
  watchers.forEach((w) => {
    w.analyser.getByteFrequencyData(w.data);
    let sum = 0;
    for (let i = 0; i < w.data.length; i++) sum += w.data[i] ?? 0;
    const avg = sum / w.data.length;

    if (avg > LEVEL_ON) w.lastLoudAt = now;
    const speaking = w.speaking
      ? avg > LEVEL_OFF || now - w.lastLoudAt < RELEASE_MS
      : avg > LEVEL_ON;

    if (speaking !== w.speaking) {
      w.speaking = speaking;
      w.listeners.forEach((fn) => fn(speaking));
    }
  });
};

const ensureTimer = (): void => {
  if (timer === null && watchers.size > 0) timer = setInterval(tick, POLL_MS);
};

const stopTimerIfIdle = (): void => {
  if (timer !== null && watchers.size === 0) {
    clearInterval(timer);
    timer = null;
  }
};

/**
 * Watch a stream's audio and report when its owner starts/stops speaking.
 * Returns an unsubscribe function; the analyser is torn down once the last
 * listener for that stream goes away.
 */
export const observeSpeaking = (
  stream: MediaStream,
  onChange: Listener,
): (() => void) => {
  if (stream.getAudioTracks().length === 0) return () => undefined;

  let watcher = watchers.get(stream);
  if (!watcher) {
    const ctx = getContext();
    if (!ctx) return () => undefined;
    try {
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      watcher = {
        source,
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount),
        listeners: new Set(),
        speaking: false,
        lastLoudAt: 0,
      };
      watchers.set(stream, watcher);
    } catch {
      // Detection is a nicety - never let it break the tile.
      return () => undefined;
    }
  }

  const w = watcher;
  w.listeners.add(onChange);
  ensureTimer();

  return () => {
    w.listeners.delete(onChange);
    if (w.listeners.size > 0) return;
    try {
      w.source.disconnect();
    } catch {
      // already gone
    }
    watchers.delete(stream);
    stopTimerIfIdle();
  };
};

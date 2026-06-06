import { useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";
import {
  isAudioUnlocked,
  subscribeAudioUnlock,
  unlockAudio,
} from "@/lib/audioUnlock";

// Touch-capable devices are the ones whose browsers block autoplay of audio
// until a gesture (phones/tablets). Desktop autoplays remote audio fine, so we
// don't want to nag desktop users with a prompt they don't need. Evaluated once
// at module load — form factor doesn't change mid-session.
const needsUnlockPrompt =
  typeof window !== "undefined" &&
  (("ontouchstart" in window) || navigator.maxTouchPoints > 0);

export const AudioUnlockOverlay = () => {
  const unlocked = useSyncExternalStore(
    subscribeAudioUnlock,
    isAudioUnlocked,
    () => true, // SSR/no-window: assume unlocked so nothing renders
  );

  if (unlocked || !needsUnlockPrompt) return null;

  return (
    <button
      type="button"
      onClick={unlockAudio}
      aria-label="Tap to enable audio"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--primary)]/20 shadow-[0_0_24px_rgba(97,9,129,0.45)]">
        <Volume2 className="h-9 w-9 text-white" />
      </span>
      <span className="text-base font-semibold text-white">
        Tap to enable audio
      </span>
      <span className="max-w-xs px-6 text-center text-xs text-zinc-300">
        Your browser blocks sound until you interact. Tap anywhere to hear other
        participants.
      </span>
    </button>
  );
};

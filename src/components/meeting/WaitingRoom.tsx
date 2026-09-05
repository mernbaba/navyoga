import { Hourglass, PhoneOff, Users } from "lucide-react";
import { useSfuMeeting } from "@/context/SfuMeetingContext";
import { RoomBrand } from "@/components/meeting/RoomShell";

// Shown while the class has no host. Students sit here with no transports and
// no producers - they can't see, hear or message each other - until the yoga
// shikshak joins, at which point the provider admits them automatically.
export const WaitingRoom = () => {
  const { waitingCount, leaveMeeting } = useSfuMeeting();
  const others = Math.max(0, waitingCount - 1);

  return (
    <div className="flex h-dvh w-full flex-col bg-zinc-950 text-white">
      {/* A row, not an absolute overlay: on a short phone screen the brand used
          to sit on top of the heading. */}
      <header className="flex shrink-0 items-center px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <RoomBrand showWordmark />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-4">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="relative mb-7 flex h-24 w-24 shrink-0 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/20 motion-reduce:animate-none" />
            <span className="absolute inset-0 rounded-full bg-[var(--primary)]/10" />
            <Hourglass className="relative h-10 w-10 text-[var(--primary)]" />
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">
            Waiting for your yoga shikshak
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            The class hasn't started yet. You'll be taken in automatically the
            moment your shikshak joins - please keep this window open.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2">
            <Users className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300">
              {waitingCount <= 1
                ? "You're the first one here"
                : `You and ${others} other${others === 1 ? "" : "s"} waiting`}
            </span>
          </div>

          <p className="mt-6 text-xs font-medium text-zinc-600">
            Nothing is being shared - not even with the others waiting
          </p>

          <button
            type="button"
            onClick={leaveMeeting}
            className="mt-9 flex items-center gap-2 rounded-xl bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-400 transition-all duration-150 hover:bg-red-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <PhoneOff className="h-4 w-4" />
            Leave
          </button>
        </div>
      </div>

      <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

import { Hourglass, PhoneOff, Users } from "lucide-react";
import { useSfuMeeting } from "@/context/SfuMeetingContext";

// Shown while the class has no host. Students sit here with no transports and
// no producers - they can't see, hear or message each other - until the yoga
// shikshak joins, at which point the provider admits them automatically.
export const WaitingRoom = () => {
  const { waitingCount, leaveMeeting } = useSfuMeeting();
  const others = Math.max(0, waitingCount - 1);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="absolute left-4 top-4 flex items-center gap-2.5">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shadow-[#610981]/30">
          <img
            src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg"
            alt="Navyoga"
            className="h-full w-full object-contain"
          />
        </div>
        <span className="text-sm font-semibold text-white drop-shadow">
          Navyoga Wellness
        </span>
      </div>

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)]/20" />
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
          <Users className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300">
            {waitingCount <= 1
              ? "You're the first one here"
              : `You and ${others} other${others === 1 ? "" : "s"} waiting`}
          </span>
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          Nothing is being shared - not even with the others waiting
        </p>

        <button
          onClick={leaveMeeting}
          className="mt-9 flex items-center gap-2 rounded-xl bg-red-500/15 px-5 py-3 text-sm font-semibold text-red-400 transition-all duration-150 hover:bg-red-500/25 active:scale-95"
        >
          <PhoneOff className="h-4 w-4" />
          Leave
        </button>
      </div>
    </div>
  );
};

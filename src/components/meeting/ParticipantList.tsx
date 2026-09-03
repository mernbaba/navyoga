import { Mic, MicOff, MoreVertical, ShieldCheck, X } from "lucide-react";
import { useMeeting } from "@/context/MeetingContext";
import { useState } from "react";

export const ParticipantList = () => {
  const {
    self,
    hostUserId,
    participants,
    hostMuteParticipant,
    hostRemoveParticipant,
    setActivePanel,
  } = useMeeting();

  const isHost = !!self && self.userId === hostUserId;
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  return (
    // Under the video in portrait, beside it in landscape - see ChatPanel.
    <aside className="flex min-h-0 w-full shrink-0 basis-[48%] flex-col border-t border-zinc-800 bg-zinc-900 landscape:w-80 landscape:max-w-[45%] landscape:basis-auto landscape:border-l landscape:border-t-0">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-white">
          Participants{" "}
          <span className="font-normal tabular-nums text-zinc-400">
            ({participants.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setActivePanel(null)}
          aria-label="Close participants"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {participants.map((p) => {
          const isYou = self?.userId === p.userId;
          const isThisHost = p.userId === hostUserId;
          const canManage = isHost && !isYou && !isThisHost;
          const isOpen = openMenuFor === p.userId;
          return (
            <li
              key={p.userId}
              className="flex flex-col rounded-lg border border-transparent bg-zinc-950/40 hover:border-zinc-800"
            >
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--secondary,#ff691d)]/30 text-xs font-bold text-white">
                  {p.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-white">
                      {p.name}
                      {isYou && " (You)"}
                    </span>
                    {isThisHost && (
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {isThisHost ? "Shikshak" : "Student"}
                  </div>
                </div>
                {p.isMuted ? (
                  <MicOff className="h-4 w-4 shrink-0 text-red-400" />
                ) : (
                  <Mic className="h-4 w-4 shrink-0 text-emerald-400" />
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setOpenMenuFor(isOpen ? null : p.userId)}
                    aria-label={`Manage ${p.name}`}
                    aria-expanded={isOpen}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Opens in place instead of as a floating menu: the old dropdown
                  was absolutely positioned inside a scrolling list, so it sat on
                  top of the next student and was clipped away entirely for the
                  last one in a short phone-height panel. */}
              {canManage && isOpen && (
                <div className="flex gap-2 border-t border-zinc-800 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      hostMuteParticipant(p.userId);
                      setOpenMenuFor(null);
                    }}
                    className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                  >
                    Mute
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      hostRemoveParticipant(p.userId);
                      setOpenMenuFor(null);
                    }}
                    className="flex-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 motion-reduce:transition-none"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

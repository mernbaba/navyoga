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
    <aside className="flex w-80 flex-col border-l border-zinc-800 bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Participants
          </div>
          <div className="text-sm font-semibold text-white">
            {participants.length} in room
          </div>
        </div>
        <button
          onClick={() => setActivePanel(null)}
          className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {participants.map((p) => {
          const isYou = self?.userId === p.userId;
          const isThisHost = p.userId === hostUserId;
          return (
            <li
              key={p.userId}
              className="relative flex items-center gap-3 rounded-lg border border-transparent bg-zinc-950/40 px-3 py-2 hover:border-zinc-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--secondary,#ff691d)]/30 text-xs font-bold text-white">
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
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {isThisHost ? "Host" : "Participant"}
                </div>
              </div>
              {p.isMuted ? (
                <MicOff className="h-4 w-4 text-red-400" />
              ) : (
                <Mic className="h-4 w-4 text-emerald-400" />
              )}
              {isHost && !isYou && !isThisHost && (
                <>
                  <button
                    onClick={() =>
                      setOpenMenuFor(openMenuFor === p.userId ? null : p.userId)
                    }
                    className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenuFor === p.userId && (
                    <div className="absolute right-2 top-12 z-30 w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
                      <button
                        onClick={() => {
                          hostMuteParticipant(p.userId);
                          setOpenMenuFor(null);
                        }}
                        className="block w-full rounded px-3 py-2 text-left text-xs font-medium text-white transition hover:bg-zinc-800"
                      >
                        Mute participant
                      </button>
                      <button
                        onClick={() => {
                          hostRemoveParticipant(p.userId);
                          setOpenMenuFor(null);
                        }}
                        className="block w-full rounded px-3 py-2 text-left text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                      >
                        Remove from class
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

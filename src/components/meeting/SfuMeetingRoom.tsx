import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  SfuMeetingProvider,
  useSfuMeeting,
} from "@/context/SfuMeetingContext";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantList } from "@/components/meeting/ParticipantList";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { AudioUnlockOverlay } from "@/components/meeting/AudioUnlockOverlay";
import { WaitingRoom } from "@/components/meeting/WaitingRoom";

type Props = {
  classId: string;
  role: "host" | "guest";
  displayName: string;
  onLeave: () => void;
};

// Same shell as the mesh MeetingRoom, but backed by the SFU provider. The
// shared VideoGrid/ControlBar/ParticipantList/ChatPanel components read the
// mesh MeetingContext, which SfuMeetingProvider also supplies - so they render
// against the SFU session with no changes.
// The retry loop in SfuMeetingContext deliberately never gives up on its own
// (a single blip shouldn't eject anyone) - so if we've been stuck on
// "connecting" this long, something isn't self-healing (stale auth, dead
// network, server issue) and the user needs a way out that isn't refreshing
// the tab.
const STUCK_RECONNECT_MS = 15000;
// How long connectionState must stay off "connecting" before we consider the
// session genuinely recovered and forget how long the user was stuck.
const STABLE_RESET_MS = 5000;

const SfuMeetingRoomShell = () => {
  const { connectionState, activePanel, isRecording, leaveMeeting } =
    useSfuMeeting();
  const [stuck, setStuck] = useState(false);
  // When the current run of trouble started - kept across brief flickers back
  // to "joined" so a flapping network can't hide from the stuck banner.
  const disruptionStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (connectionState === "connecting") {
      if (disruptionStartRef.current === null) {
        disruptionStartRef.current = Date.now();
      }
      const elapsed = Date.now() - disruptionStartRef.current;
      const remaining = Math.max(STUCK_RECONNECT_MS - elapsed, 0);
      if (remaining === 0) {
        setStuck(true);
        return;
      }
      const timer = window.setTimeout(() => setStuck(true), remaining);
      return () => window.clearTimeout(timer);
    }

    // Not "connecting" right now, but don't erase the disruption clock (and
    // the "stuck" escape hatch) the instant it clears - a network that keeps
    // bouncing between "joined" and "connecting" for seconds at a time used
    // to reset this on every brief recovery, so the 15s banner could never
    // appear no matter how long the user was actually stuck reconnecting.
    // Only forget once we've been stable for a real stretch.
    const timer = window.setTimeout(() => {
      disruptionStartRef.current = null;
      setStuck(false);
    }, STABLE_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [connectionState]);

  // No host in the class yet - hold this student outside it entirely.
  if (connectionState === "waiting") {
    return <WaitingRoom />;
  }

  if (connectionState === "connecting") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-zinc-400">Connecting to class…</p>
        {stuck && (
          <div className="mt-2 flex flex-col items-center gap-3">
            <p className="max-w-xs text-center text-xs text-zinc-500">
              This is taking longer than usual. You can keep waiting, or
              leave and rejoin.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={leaveMeeting}
                className="rounded-md border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950"
              >
                Leave class
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-zinc-950">
      <div className="absolute left-4 top-4 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
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
        {isRecording && (
          <div className="flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1 backdrop-blur">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">
              Rec
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <VideoGrid />
        </div>
        {activePanel === "participants" && <ParticipantList />}
        {activePanel === "chat" && <ChatPanel />}
      </div>
      <ControlBar />
      <AudioUnlockOverlay />
    </div>
  );
};

export const SfuMeetingRoom = ({
  classId,
  role,
  displayName,
  onLeave,
}: Props) => {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <SfuMeetingProvider
        classId={classId}
        role={role}
        displayName={displayName}
        onLeave={onLeave}
      >
        <SfuMeetingRoomShell />
      </SfuMeetingProvider>
    </div>
  );
};

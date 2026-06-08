import { Loader2 } from "lucide-react";
import {
  MeetingProvider,
  useMeeting,
} from "@/context/MeetingContext";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantList } from "@/components/meeting/ParticipantList";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { AudioUnlockOverlay } from "@/components/meeting/AudioUnlockOverlay";

type Props = {
  classId: string;
  role: "host" | "guest";
  displayName: string;
  onLeave: () => void;
};

const MeetingRoomShell = () => {
  const { connectionState, activePanel, isRecording } = useMeeting();

  if (connectionState === "connecting") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-zinc-400">Connecting to class…</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-zinc-950">
      {isRecording && (
        <div className="absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1 backdrop-blur">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">
            Rec
          </span>
        </div>
      )}
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

export const MeetingRoom = ({
  classId,
  role,
  displayName,
  onLeave,
}: Props) => {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <MeetingProvider
        classId={classId}
        role={role}
        displayName={displayName}
        onLeave={onLeave}
      >
        <MeetingRoomShell />
      </MeetingProvider>
    </div>
  );
};

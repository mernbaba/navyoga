import { Loader2 } from "lucide-react";
import {
  MeetingProvider,
  useMeeting,
} from "@/context/MeetingContext";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantList } from "@/components/meeting/ParticipantList";
import { ChatPanel } from "@/components/meeting/ChatPanel";

type Props = {
  classId: string;
  role: "host" | "guest";
  displayName: string;
  onLeave: () => void;
};

const MeetingRoomShell = () => {
  const { connectionState, activePanel } = useMeeting();

  if (connectionState === "connecting") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-zinc-400">Connecting to class…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-zinc-950">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <VideoGrid />
        </div>
        {activePanel === "participants" && <ParticipantList />}
        {activePanel === "chat" && <ChatPanel />}
      </div>
      <ControlBar />
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

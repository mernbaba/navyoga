import { Loader2 } from "lucide-react";
import {
  MeetingProvider,
  useMeeting,
} from "@/context/MeetingContext";
import { ControlBar } from "@/components/meeting/ControlBar";
import { AudioUnlockOverlay } from "@/components/meeting/AudioUnlockOverlay";
import { RoomShell } from "@/components/meeting/RoomShell";
import { RoomStage } from "@/components/meeting/RoomStage";

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
      <RoomShell bare>
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] motion-reduce:animate-none" />
          <p className="text-sm text-zinc-400">Connecting to class…</p>
        </div>
      </RoomShell>
    );
  }

  return (
    <RoomShell isRecording={isRecording}>
      <RoomStage activePanel={activePanel} />
      <ControlBar />
      <AudioUnlockOverlay />
    </RoomShell>
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

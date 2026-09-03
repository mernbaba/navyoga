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
      <div className="absolute left-4 top-4 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shadow-[#610981]/30">
            <img
              src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg"
              alt="Navyoga"
              className="h-full w-full object-contain"
            />
          </div>
          {/* Phones only have room for the logo mark: the wordmark shares
              this row with the view toggle and the two collide in gallery
              mode. */}
          <span className="hidden text-sm font-semibold text-white drop-shadow sm:inline">
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

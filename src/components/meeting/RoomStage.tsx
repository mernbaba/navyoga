import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ParticipantList } from "@/components/meeting/ParticipantList";
import { ChatPanel } from "@/components/meeting/ChatPanel";

type Props = {
  activePanel: "participants" | "chat" | null;
};

// The middle row of the room. Video and the open panel are flex siblings, never
// stacked on top of each other: in portrait the panel takes the lower part of
// the stage and the video keeps the rest, so the tutor can still watch the class
// while reading chat. In landscape - phone on its side, or any desktop window -
// the panel moves to a column on the right, where height is the scarce axis.
export const RoomStage = ({ activePanel }: Props) => (
  <main className="flex min-h-0 flex-col overflow-hidden landscape:flex-row">
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <VideoGrid />
    </div>
    {activePanel === "participants" && <ParticipantList />}
    {activePanel === "chat" && <ChatPanel />}
  </main>
);

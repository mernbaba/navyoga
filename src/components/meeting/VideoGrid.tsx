import { useState } from "react";
import { LayoutGrid, User } from "lucide-react";
import { useMeeting } from "@/context/MeetingContext";
import { VideoTile } from "@/components/meeting/VideoTile";

type Tile = {
  id: string;
  stream: MediaStream | null;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isActiveSpeaker: boolean;
  isHost: boolean;
  isScreenShare: boolean;
};

const getGridClass = (count: number): string => {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-3";
};

export const VideoGrid = () => {
  const {
    localStream,
    self,
    hostUserId,
    isMuted,
    isVideoOff,
    isScreenSharing,
    peers,
    activeSpeaker,
  } = useMeeting();
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("speaker");

  const localTile: Tile = {
    id: "local",
    stream: localStream,
    name: self?.name ?? "You",
    isLocal: true,
    isMuted,
    isVideoOff,
    isActiveSpeaker: activeSpeaker === "local",
    isHost: !!self && !!hostUserId && self.userId === hostUserId,
    isScreenShare: isScreenSharing,
  };

  const remoteTiles: Tile[] = Object.entries(peers).map(([sid, peer]) => ({
    id: sid,
    stream: peer.stream,
    name: peer.participant.name,
    isLocal: false,
    isMuted: peer.participant.isMuted,
    isVideoOff: peer.participant.isVideoOff,
    isActiveSpeaker: activeSpeaker === sid,
    isHost: !!hostUserId && peer.participant.userId === hostUserId,
    isScreenShare: peer.participant.isScreenSharing,
  }));

  const allTiles = [localTile, ...remoteTiles];

  // Speaker view always pins the host (yoga teacher) - it never follows the
  // active speaker, so the host stays put even when muted or when a student is
  // the loudest. Until the host actually joins the room there is no host tile,
  // so we show the local user (never switching between students who speak).
  let speakerTile = allTiles.find((t) => t.isHost);
  if (!speakerTile) speakerTile = localTile;
  const thumbnails = allTiles.filter((t) => t.id !== speakerTile.id);

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-zinc-950 p-4">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-1.5 py-1 backdrop-blur-md">
        <button
          onClick={() => setViewMode("gallery")}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
            viewMode === "gallery"
              ? "bg-[var(--primary)] text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Gallery
        </button>
        <button
          onClick={() => setViewMode("speaker")}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
            viewMode === "speaker"
              ? "bg-[var(--primary)] text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <User className="h-4 w-4" />
          Speaker
        </button>
      </div>

      {viewMode === "gallery" ? (
        <div className="flex h-full w-full flex-1 items-center justify-center">
          <div
            className={`grid h-full w-full items-center justify-center gap-4 ${getGridClass(allTiles.length)}`}
          >
            {allTiles.map((tile) => (
              <div
                key={tile.id}
                className="h-full min-h-[180px] w-full max-h-[480px]"
              >
                <VideoTile {...tile} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-1 flex-col gap-4 overflow-hidden">
          {thumbnails.length > 0 && (
            <div className="flex h-28 items-center gap-3 overflow-x-auto px-2 py-1">
              {thumbnails.map((tile) => (
                <div key={tile.id} className="h-24 w-40 flex-shrink-0">
                  <VideoTile {...tile} />
                </div>
              ))}
            </div>
          )}
          <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
            <div className="h-full max-h-[640px] w-full max-w-5xl">
              <VideoTile {...speakerTile} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

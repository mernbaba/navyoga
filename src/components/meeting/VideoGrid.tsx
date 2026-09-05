import { useEffect, useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import { useMeeting } from "@/context/MeetingContext";
import { VideoTile } from "@/components/meeting/VideoTile";
import { useRoomView } from "@/components/meeting/RoomShell";

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

// Gallery view always lays tiles out in a fixed 3-column grid on landscape
// screens (desktop) - no dynamic column search, so the layout stays
// predictable regardless of class size or window size.
const GALLERY_COLS = 3;
// Portrait screens (phones, tablets held upright) can't take 3 columns: a
// single row of 3 stretched to the full height turns every tile into a tall
// sliver a few finger-widths wide. Two people stack on top of each other,
// three or more go two across; rows share the height until they'd drop below
// a readable minimum, then the grid scrolls instead of shrinking further.
const GALLERY_COLS_PORTRAIT = 2;

export const VideoGrid = () => {
  const {
    role,
    localStream,
    self,
    hostUserId,
    isMuted,
    isVideoOff,
    isScreenSharing,
    peers,
    activeSpeaker,
  } = useMeeting();
  // The view switch itself lives in the room's status rail - see RoomShell.
  const { viewMode, galleryFit } = useRoomView();
  // Tile id blown up in the focus modal (gallery view), null when closed.
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Escape closes the focus modal.
  useEffect(() => {
    if (!focusedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedId]);

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

  // Resolved live each render so the modal keeps following mute/video changes,
  // and closes itself if that participant leaves the room.
  const focusedTile = focusedId
    ? (allTiles.find((t) => t.id === focusedId) ?? null)
    : null;

  const galleryRows = Math.ceil(allTiles.length / GALLERY_COLS) || 1;
  // Only go two across once there are more tiles than columns - one or two
  // people stack full-width instead.
  const galleryColsPortrait =
    allTiles.length > GALLERY_COLS_PORTRAIT ? GALLERY_COLS_PORTRAIT : 1;

  return (
    // No top padding reserved for chrome any more: the brand block and the view
    // switch have their own row in RoomShell, so the whole of this box is video.
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-zinc-950 px-2 py-2 sm:px-4 sm:py-3">
      {viewMode === "gallery" ? (
        // Everyone fits the frame: fixed 3-column grid on landscape, never
        // scrolls - tiles shrink as the class grows. Click a tile to open it
        // full-size in the focus modal.
        <div
          // px/pb leave room for the host tile's glow, which the overflow-hidden
          // would otherwise slice off at the edges of the grid. Portrait
          // scrolls vertically once the rows hit their minimum height.
          className="h-full min-h-0 w-full flex-1 overflow-hidden px-1 pb-1 portrait:overflow-y-auto"
        >
          <div
            // Track templates are passed as CSS variables rather than inline
            // grid-template-* styles: an inline style would always beat the
            // portrait variant below, which needs to swap both templates.
            className="grid h-full w-full grid-cols-(--gallery-cols) grid-rows-(--gallery-rows) gap-2 sm:gap-4 portrait:grid-cols-(--gallery-cols-portrait) portrait:grid-rows-none portrait:auto-rows-[minmax(9rem,1fr)]"
            style={
              {
                "--gallery-cols": `repeat(${GALLERY_COLS}, minmax(0, 1fr))`,
                "--gallery-rows": `repeat(${galleryRows}, minmax(0, 1fr))`,
                "--gallery-cols-portrait": `repeat(${galleryColsPortrait}, minmax(0, 1fr))`,
              } as CSSProperties
            }
          >
            {allTiles.map((tile) => (
              <div key={tile.id} className="min-h-0 min-w-0">
                <VideoTile
                  {...tile}
                  fit={galleryFit}
                  onClick={() => setFocusedId(tile.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Thumbnails sit in a vertical rail on the right (desktop) so the
        // speaker keeps the full height; narrow screens fall back to the
        // horizontal strip above the speaker.
        <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden lg:flex-row-reverse lg:gap-4">
          {/* Students only ever see the teacher in speaker view - the rail of
              other participants is for the tutor. (Gallery still shows all.) */}
          {role === "host" && thumbnails.length > 0 && (
            // pr-2 leaves a gutter so the scrollbar never sits on top of the
            // tiles. No top margin: chrome no longer floats over this strip.
            <div className="flex h-24 shrink-0 items-center gap-3 overflow-x-auto overflow-y-hidden px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:h-28 lg:h-auto lg:w-56 lg:flex-col lg:items-stretch lg:overflow-x-hidden lg:overflow-y-auto lg:py-0 lg:pl-0 lg:pr-2 lg:[scrollbar-width:thin] lg:[scrollbar-color:var(--color-zinc-700)_transparent] lg:[&::-webkit-scrollbar]:block xl:w-64">
              {thumbnails.map((tile) => (
                <div
                  key={tile.id}
                  className="h-full w-32 shrink-0 sm:w-40 lg:h-auto lg:aspect-video lg:w-full"
                >
                  <VideoTile {...tile} />
                </div>
              ))}
            </div>
          )}
          <div className="flex w-full min-h-0 flex-1 items-center justify-center overflow-hidden p-1">
            <div className="h-full max-h-[640px] w-full max-w-5xl">
              <VideoTile {...speakerTile} fit="contain" />
            </div>
          </div>
        </div>
      )}

      {/* Focus modal - one participant, full size. Covers the video area only
          so the control rail stays reachable underneath. */}
      {focusedTile && (
        <div
          onClick={() => setFocusedId(null)}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            onClick={() => setFocusedId(null)}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-300 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full max-h-[85%] w-full max-w-6xl"
          >
            <VideoTile {...focusedTile} fit="contain" />
          </div>
        </div>
      )}
    </div>
  );
};

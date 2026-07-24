import { useEffect, useRef, useState } from "react";
import { LayoutGrid, User, X } from "lucide-react";
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

// Gap between gallery tiles, in px - must stay in sync with the `gap-4` class
// on the grid, since the column search below reasons about real pixels.
const GALLERY_GAP = 16;
const TILE_ASPECT = 16 / 9;

// Pick the column count that makes every tile as large as possible while the
// whole grid still fits the container - no scrolling, everyone on screen. Tries
// each candidate and scores it by the area of the largest 16:9 box that fits in
// one cell (Meet/Zoom do the same); the widest tiles win.
const bestColumnCount = (
  count: number,
  width: number,
  height: number,
): number => {
  if (count <= 1) return 1;
  // Before the container has been measured, fall back to a square-ish grid.
  if (width <= 0 || height <= 0) return Math.ceil(Math.sqrt(count));

  let bestCols = 1;
  let bestArea = 0;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellW = (width - GALLERY_GAP * (cols - 1)) / cols;
    const cellH = (height - GALLERY_GAP * (rows - 1)) / rows;
    if (cellW <= 0 || cellH <= 0) continue;
    const tileW = Math.min(cellW, cellH * TILE_ASPECT);
    const area = tileW * (tileW / TILE_ASPECT);
    if (area > bestArea) {
      bestArea = area;
      bestCols = cols;
    }
  }
  return bestCols;
};

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
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("speaker");
  // Tile id blown up in the focus modal (gallery view), null when closed.
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [gallerySize, setGallerySize] = useState({ width: 0, height: 0 });

  // Measure the gallery area so the tile grid can be sized to fit it exactly.
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setGallerySize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode]);

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

  const galleryCols = bestColumnCount(
    allTiles.length,
    gallerySize.width,
    gallerySize.height,
  );
  const galleryRows = Math.ceil(allTiles.length / galleryCols);

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
        // Everyone fits the frame: the grid is sized to the measured area and
        // never scrolls - tiles shrink as the class grows. Click a tile to open
        // it full-size in the focus modal.
        <div
          ref={galleryRef}
          // px/pb leave room for the host tile's glow, which the overflow-hidden
          // would otherwise slice off at the edges of the grid.
          className="h-full w-full flex-1 overflow-hidden px-1 pb-1 pt-11"
        >
          <div
            className="grid h-full w-full gap-4"
            style={{
              gridTemplateColumns: `repeat(${galleryCols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${galleryRows}, minmax(0, 1fr))`,
            }}
          >
            {allTiles.map((tile) => (
              <div key={tile.id} className="min-h-0 min-w-0">
                <VideoTile {...tile} onClick={() => setFocusedId(tile.id)} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Thumbnails sit in a vertical rail on the right (desktop) so the
        // speaker keeps the full height; narrow screens fall back to the
        // horizontal strip above the speaker.
        <div className="flex h-full w-full flex-1 flex-col gap-4 overflow-hidden lg:flex-row-reverse">
          {/* Students only ever see the teacher in speaker view - the rail of
              other participants is for the tutor. (Gallery still shows all.) */}
          {role === "host" && thumbnails.length > 0 && (
            // mt-11 (not pt) keeps the rail clear of the Gallery/Speaker
            // toggle even when scrolled; pr-2 leaves a gutter so the
            // scrollbar never sits on top of the tiles.
            <div className="flex h-28 shrink-0 items-center gap-3 overflow-x-auto px-2 py-1 lg:mt-11 lg:h-auto lg:w-56 lg:flex-col lg:items-stretch lg:overflow-x-hidden lg:overflow-y-auto lg:py-0 lg:pl-0 lg:pr-2 lg:scrollbar-thin lg:[scrollbar-color:var(--color-zinc-700)_transparent] xl:w-64">
              {thumbnails.map((tile) => (
                <div
                  key={tile.id}
                  className="h-24 w-40 shrink-0 lg:h-auto lg:aspect-video lg:w-full"
                >
                  <VideoTile {...tile} />
                </div>
              ))}
            </div>
          )}
          <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-1">
            <div className="h-full max-h-[640px] w-full max-w-5xl">
              <VideoTile {...speakerTile} fit="contain" />
            </div>
          </div>
        </div>
      )}

      {/* Focus modal - one participant, full size. Covers the video area only
          so the control bar stays reachable underneath. */}
      {focusedTile && (
        <div
          onClick={() => setFocusedId(null)}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            onClick={() => setFocusedId(null)}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full max-h-[85vh] w-full max-w-6xl"
          >
            <VideoTile {...focusedTile} fit="contain" />
          </div>
        </div>
      )}
    </div>
  );
};

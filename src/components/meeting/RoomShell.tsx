import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LayoutGrid, Maximize2, Minimize2, User } from "lucide-react";

export type ViewMode = "gallery" | "speaker";
export type GalleryFit = "cover" | "contain";

type ViewState = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  galleryFit: GalleryFit;
  toggleGalleryFit: () => void;
};

const ViewContext = createContext<ViewState | null>(null);

// Lives here rather than inside VideoGrid because the switch that drives it
// sits in the status rail: the control is a statement about the room, not a
// widget floating on top of the video.
export const useRoomView = (): ViewState => {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useRoomView must be used inside RoomShell");
  return ctx;
};

const ViewSwitch = () => {
  const { viewMode, setViewMode, galleryFit, toggleGalleryFit } = useRoomView();

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-zinc-800 bg-zinc-900/85 p-1 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setViewMode("gallery")}
        aria-pressed={viewMode === "gallery"}
        title="Everyone"
        className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:px-3 ${
          viewMode === "gallery"
            ? "bg-[var(--primary)] text-white"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Everyone</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode("speaker")}
        aria-pressed={viewMode === "speaker"}
        title="Shikshak"
        className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:px-3 ${
          viewMode === "speaker"
            ? "bg-[var(--primary)] text-white"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <User className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Shikshak</span>
      </button>
      {viewMode === "gallery" && (
        <>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-zinc-700" />
          <button
            type="button"
            onClick={toggleGalleryFit}
            title={
              galleryFit === "cover"
                ? "Show the whole frame"
                : "Fill the tile"
            }
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:px-3"
          >
            {galleryFit === "cover" ? (
              <Minimize2 className="h-4 w-4 shrink-0" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {galleryFit === "cover" ? "Fit" : "Fill"}
            </span>
          </button>
        </>
      )}
    </div>
  );
};

export const RoomBrand = ({ showWordmark = false }: { showWordmark?: boolean }) => (
  <div className="flex min-w-0 items-center gap-2.5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shadow-[#610981]/30 sm:h-10 sm:w-10">
      <img
        src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg"
        alt="Navyoga"
        className="h-full w-full object-contain"
      />
    </div>
    <span
      className={`truncate text-sm font-semibold text-white ${
        showWordmark ? "" : "hidden sm:inline"
      }`}
    >
      Navyoga Wellness
    </span>
  </div>
);

type Props = {
  isRecording?: boolean;
  /** Chrome-free rooms (waiting, connecting) skip the rails entirely. */
  bare?: boolean;
  children: ReactNode;
};

// The room is three grid rows: status rail, stage, control rail. Only the
// stage flexes. Nothing in the room is absolutely positioned over the stage,
// so chrome cannot land on top of video at any viewport size - the previous
// layout floated the brand block and the view switch over the grid and paid
// for it with hand-tuned pt-12/mt-12 offsets that were flush to the pixel.
export const RoomShell = ({ isRecording = false, bare = false, children }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>("speaker");
  const [galleryFit, setGalleryFit] = useState<GalleryFit>("cover");

  // The app's global Sonner toaster is fixed at top:16px with a z-index far
  // above the room, so on a phone (where a toast spans the full width) it lands
  // squarely on the status rail. Flag the room so CSS can drop toasts below the
  // rail for as long as a class is open - see index.css.
  useEffect(() => {
    if (bare) return;
    document.body.classList.add("meeting-open");
    return () => document.body.classList.remove("meeting-open");
  }, [bare]);

  const value = useMemo<ViewState>(
    () => ({
      viewMode,
      setViewMode,
      galleryFit,
      toggleGalleryFit: () =>
        setGalleryFit((f) => (f === "cover" ? "contain" : "cover")),
    }),
    [viewMode, galleryFit],
  );

  if (bare) {
    return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
  }

  return (
    <ViewContext.Provider value={value}>
      {/* dvh, not vh: a phone's mobile browser chrome shrinks the visual
          viewport, and vh keeps the control rail underneath the URL bar. */}
      <div className="relative grid h-dvh w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-zinc-950">
        <header className="flex items-center justify-between gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <RoomBrand />
            {isRecording && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1 backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" />
                <span className="text-[11px] font-bold text-red-400">Rec</span>
              </div>
            )}
          </div>
          <ViewSwitch />
        </header>
        {children}
      </div>
    </ViewContext.Provider>
  );
};

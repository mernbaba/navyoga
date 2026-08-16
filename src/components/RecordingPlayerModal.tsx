import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

export type RecordingPlayerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title: string;
  /** ISO timestamp shown alongside the title, formatted in the viewer's local timezone. */
  scheduledAt?: string | null;
};

function formatLocalDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Plays a class recording inline in a modal instead of opening the media URL
// in a new browser tab. While open, the document title is swapped to the
// class name + local date/time so a pinned/shared tab reads meaningfully;
// it's restored on close.
export function RecordingPlayerModal({
  open,
  onOpenChange,
  src,
  title,
  scheduledAt,
}: RecordingPlayerModalProps) {
  const localDateTime = formatLocalDateTime(scheduledAt);
  const pageTitle = localDateTime ? `${title} - ${localDateTime}` : title;

  useEffect(() => {
    if (!open) return;
    const previousTitle = document.title;
    document.title = pageTitle;
    return () => {
      document.title = previousTitle;
    };
  }, [open, pageTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="p-4 pb-3">
          <DialogTitle className="pr-8">{title}</DialogTitle>
          {localDateTime && (
            <DialogDescription>{localDateTime}</DialogDescription>
          )}
        </DialogHeader>
        <div className="bg-black">
          {open && (
            <video
              key={src}
              className="max-h-[70vh] w-full"
              src={src}
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              disableRemotePlayback
              onContextMenu={(e) => e.preventDefault()}
              autoPlay
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

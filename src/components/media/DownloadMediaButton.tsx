import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadMedia } from "@/lib/media";
import { cn } from "@/components/ui/utils";

type Props = {
  // Stored media path (e.g. a recording's `storePath`). Renders nothing if absent.
  path: string | null | undefined;
  // Optional override for the saved filename; defaults to the path's last segment.
  filename?: string;
  // Visible button text. Omit for an icon-only button.
  label?: string;
  className?: string;
  title?: string;
};

// Download affordance for an uploaded media file. Used by Operations and Super
// Admin wherever a recording or course video has been uploaded, so the stored
// file can be pulled back down. Defaults to an emerald pill that matches the
// existing "Added" recording badges.
export function DownloadMediaButton({
  path,
  filename,
  label,
  className,
  title,
}: Props) {
  const [busy, setBusy] = useState(false);
  if (!path) return null;

  return (
    <button
      type="button"
      title={title ?? "Download"}
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        try {
          await downloadMedia(path, filename);
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-60",
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Download className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}

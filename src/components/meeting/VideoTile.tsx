import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";

type Props = {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isActiveSpeaker: boolean;
};

export const VideoTile = ({
  stream,
  name,
  isLocal = false,
  isMuted,
  isVideoOff,
  isActiveSpeaker,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl border-2 bg-zinc-900 transition-all duration-300 ${
        isActiveSpeaker
          ? "border-[var(--primary)] shadow-[0_0_18px_rgba(97,9,129,0.45)] scale-[1.01]"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-zinc-700 bg-[linear-gradient(135deg,rgba(97,9,129,0.25),rgba(255,105,29,0.18))] shadow-2xl">
            <span className="text-3xl font-bold tracking-wider text-white">
              {initials}
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4">
        <span className="max-w-[70%] select-none truncate text-sm font-semibold text-white">
          {name}
          {isLocal && " (You)"}
        </span>
        <div className="flex items-center gap-1.5 rounded-md border border-zinc-800/40 bg-black/40 px-2 py-1 backdrop-blur-md">
          {isMuted ? (
            <MicOff className="h-4 w-4 text-red-400" />
          ) : (
            <div className="flex h-3.5 items-center gap-[2px]">
              <span className="h-1.5 w-[2px] rounded-full bg-emerald-400" />
              <span className="h-3.5 w-[2px] rounded-full bg-emerald-400" />
              <span className="h-2.5 w-[2px] rounded-full bg-emerald-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

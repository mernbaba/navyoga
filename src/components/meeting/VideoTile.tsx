import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";
import { registerRemoteMedia } from "@/lib/audioUnlock";

type Props = {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isActiveSpeaker: boolean;
  isHost?: boolean;
  isScreenShare?: boolean;
};

export const VideoTile = ({
  stream,
  name,
  isLocal = false,
  isMuted,
  isVideoOff,
  isActiveSpeaker,
  isHost = false,
  isScreenShare = false,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Bind the stream to the <video> element whenever it (re)mounts. The element
  // is conditionally rendered (only while video is on), so this must also run
  // when isVideoOff flips - otherwise a freshly mounted element with the same
  // stream reference never gets its srcObject set.
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff, isScreenShare]);

  // Remote audio plays through a dedicated, always-mounted <audio> element so
  // it is NOT coupled to whether the remote camera is on. (The <video> element
  // above is unmounted when the remote video is off, which would otherwise
  // silence the participant. Local audio is never played back to avoid echo.)
  //
  // The element is registered with audioUnlock so .play() is called explicitly
  // and retried on the first user gesture - mobile browsers block autoplay of
  // audio until the user interacts, which otherwise silences this device's
  // outgoing audio on the remote phone (a phone never starts the playback).
  useEffect(() => {
    if (isLocal) return;
    const el = audioRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    const unregister = registerRemoteMedia(el);
    return unregister;
  }, [stream, isLocal]);

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
        isHost || isActiveSpeaker
          ? "border-[var(--primary)] shadow-[0_0_18px_rgba(97,9,129,0.45)] scale-[1.01]"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {!isLocal && stream && (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      )}

      {stream && (!isVideoOff || isScreenShare) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full ${
            isScreenShare
              ? "bg-black object-contain"
              : `object-cover ${isLocal ? "scale-x-[-1]" : ""}`
          }`}
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
        <span className="flex max-w-[70%] items-center gap-1.5 text-sm font-semibold text-white">
          <span className="select-none truncate">
            {name}
            {isLocal && " (You)"}
          </span>
          {isHost && (
            <span className="select-none rounded bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Host
            </span>
          )}
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

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Users,
  MessageSquare,
  PhoneOff,
} from "lucide-react";
import { useMeeting } from "@/context/MeetingContext";

// Screen capture simply does not exist on iOS Safari and several Android
// browsers. Rendering the button there gave the tutor a control that could
// only fail, and it cost a whole column of an already tight phone rail.
const canShareScreen =
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function";

type Control = {
  key: string;
  icon: ReactNode;
  label: string;
  // Shown under the icon at every size - only ever a short numeral.
  value?: string;
  onClick: () => void;
  tone: "neutral" | "alert" | "brand";
  disabled?: boolean;
};

export const ControlBar = () => {
  const {
    self,
    hostUserId,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    isRecordingBusy,
    activePanel,
    unreadChat,
    setActivePanel,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleRecording,
    leaveMeeting,
    endMeetingForAll,
  } = useMeeting();

  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const isHost = !!self && self.userId === hostUserId;

  const togglePanel = (name: "participants" | "chat") => {
    setActivePanel(activePanel === name ? null : name);
  };

  const controls: Control[] = [
    {
      key: "mic",
      icon: isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />,
      label: isMuted ? "Unmute" : "Mute",
      onClick: toggleMute,
      tone: isMuted ? "alert" : "neutral",
    },
    {
      key: "camera",
      icon: isVideoOff ? (
        <VideoOff className="h-5 w-5" />
      ) : (
        <Video className="h-5 w-5" />
      ),
      label: isVideoOff ? "Start video" : "Stop video",
      onClick: toggleVideo,
      tone: isVideoOff ? "alert" : "neutral",
    },
  ];

  if (isHost && canShareScreen) {
    controls.push({
      key: "share",
      icon: <Monitor className="h-5 w-5" />,
      label: isScreenSharing ? "Stop sharing" : "Share screen",
      onClick: () => toggleScreenShare(),
      tone: isScreenSharing ? "brand" : "neutral",
    });
  }

  if (isHost) {
    controls.push({
      key: "record",
      icon: isRecording ? (
        <span className="h-4 w-4 rounded-sm bg-red-500" />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current">
          <span className="h-2 w-2 rounded-full bg-red-500" />
        </span>
      ),
      label: isRecordingBusy
        ? "Saving recording"
        : isRecording
          ? "Stop recording"
          : "Record class",
      onClick: toggleRecording,
      tone: isRecording ? "alert" : "neutral",
      disabled: isRecordingBusy,
    });
  }

  controls.push({
    key: "participants",
    icon: <Users className="h-5 w-5" />,
    label: "Participants",
    // The count reads as a figure under the icon instead of a 9px badge pinned
    // outside the button box, where it used to sit on top of the next control.
    value: String(participants.length),
    onClick: () => togglePanel("participants"),
    tone: activePanel === "participants" ? "brand" : "neutral",
  });

  controls.push({
    key: "chat",
    icon: <MessageSquare className="h-5 w-5" />,
    label: "Chat",
    value:
      unreadChat > 0 && activePanel !== "chat"
        ? unreadChat > 9
          ? "9+"
          : String(unreadChat)
        : undefined,
    onClick: () => togglePanel("chat"),
    tone: activePanel === "chat" ? "brand" : "neutral",
  });

  const toneClass = (tone: Control["tone"]) => {
    if (tone === "alert") return "bg-red-500/15 text-red-400 hover:bg-red-500/25";
    if (tone === "brand")
      return "bg-[var(--primary)]/25 text-[#d3a4e6] hover:bg-[var(--primary)]/35";
    return "text-zinc-300 hover:bg-zinc-800 hover:text-white";
  };

  // One column per control, counted from the list above (the leave button takes
  // the last one). The rail divides whatever width it has instead of laying out
  // fixed-width buttons in a row that ran off the edge of a 360px phone and
  // squashed its labels into each other.
  const columns = controls.length + 1;

  return (
    <div
      className="grid shrink-0 grid-cols-(--rail-cols) items-stretch gap-1 border-t border-zinc-800 bg-zinc-900 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 select-none sm:gap-2 sm:px-3 lg:mx-auto lg:w-full lg:max-w-3xl lg:rounded-t-2xl lg:border-x"
      style={{ "--rail-cols": `repeat(${columns}, minmax(0, 1fr))` } as CSSProperties}
    >
      {controls.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onClick}
          disabled={c.disabled}
          aria-label={c.label}
          title={c.label}
          className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 sm:h-16 ${toneClass(
            c.tone,
          )} ${c.disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          {c.icon}
          {c.value !== undefined && (
            <span className="text-[11px] font-bold leading-none tabular-nums">
              {c.value}
            </span>
          )}
        </button>
      ))}

      <div className="relative min-w-0">
        <button
          type="button"
          onClick={() => setShowLeaveMenu((v) => !v)}
          aria-label={isHost ? "End or leave class" : "Leave class"}
          aria-expanded={showLeaveMenu}
          title={isHost ? "End or leave class" : "Leave class"}
          className="flex h-14 w-full min-w-0 items-center justify-center rounded-xl bg-red-500 text-white transition-all duration-150 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 sm:h-16"
        >
          <PhoneOff className="h-5 w-5" />
        </button>

        {showLeaveMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowLeaveMenu(false)}
            />
            <div className="absolute bottom-full right-0 z-50 mb-3 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 shadow-2xl">
              <div className="select-none px-2.5 pb-1.5 text-xs font-semibold text-zinc-400">
                Leave this class?
              </div>
              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    endMeetingForAll();
                    setShowLeaveMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 motion-reduce:transition-none"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  End class for everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  leaveMeeting();
                  setShowLeaveMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-zinc-800 motion-reduce:transition-none"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
                Leave, class continues
              </button>
              <div className="my-1.5 border-t border-zinc-800" />
              <button
                type="button"
                onClick={() => setShowLeaveMenu(false)}
                className="w-full rounded-lg py-1.5 text-center text-xs font-semibold text-zinc-400 transition hover:text-white motion-reduce:transition-none"
              >
                Stay in class
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

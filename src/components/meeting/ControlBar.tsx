import { useState } from "react";
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

  return (
    <div className="relative flex h-20 items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 select-none sm:px-6">
      <div className="hidden w-[25%] items-center gap-3 sm:flex">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Class
          </div>
          <div className="text-sm font-semibold tracking-wide text-white">
            {participants.length} in room
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
        <button
          onClick={toggleMute}
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95 sm:h-14 sm:w-14 ${
            isMuted
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
              : "text-white hover:bg-zinc-800"
          }`}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          <span className="mt-1 text-[10px] font-semibold">
            {isMuted ? "Unmute" : "Mute"}
          </span>
        </button>

        <button
          onClick={toggleVideo}
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95 sm:h-14 sm:w-14 ${
            isVideoOff
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
              : "text-white hover:bg-zinc-800"
          }`}
        >
          {isVideoOff ? (
            <VideoOff className="h-5 w-5" />
          ) : (
            <Video className="h-5 w-5" />
          )}
          <span className="mt-1 text-[10px] font-semibold">
            {isVideoOff ? "Start" : "Stop"}
          </span>
        </button>

        {isHost && (
          <button
            onClick={() => toggleScreenShare()}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95 sm:h-14 sm:w-14 ${
              isScreenSharing
                ? "bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30"
                : "text-white hover:bg-zinc-800"
            }`}
          >
            <Monitor className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-semibold">
              {isScreenSharing ? "Sharing" : "Share"}
            </span>
          </button>
        )}

        {isHost && (
          <button
            onClick={toggleRecording}
            disabled={isRecordingBusy}
            title={isRecording ? "Stop recording" : "Record this class"}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95 sm:h-14 sm:w-14 ${
              isRecording
                ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                : "text-white hover:bg-zinc-800"
            } ${isRecordingBusy ? "pointer-events-none opacity-50" : ""}`}
          >
            {isRecording ? (
              <span className="h-5 w-5 rounded-sm bg-red-500" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current">
                <span className="h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
            <span className="mt-1 text-[10px] font-semibold">
              {isRecordingBusy ? "Saving" : isRecording ? "Stop" : "Record"}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 sm:w-[25%] sm:gap-2 md:gap-3">
        <button
          onClick={() => togglePanel("participants")}
          className={`relative rounded-lg p-2 transition hover:bg-zinc-800 sm:p-2.5 ${
            activePanel === "participants"
              ? "bg-[var(--primary)]/15 text-[var(--primary)]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            {participants.length}
          </span>
        </button>

        <button
          onClick={() => togglePanel("chat")}
          className={`relative rounded-lg p-2 transition hover:bg-zinc-800 sm:p-2.5 ${
            activePanel === "chat"
              ? "bg-[var(--primary)]/15 text-[var(--primary)]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          {unreadChat > 0 && activePanel !== "chat" && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold leading-none text-white">
              {unreadChat > 9 ? "9+" : unreadChat}
            </span>
          )}
        </button>

        <div className="relative ml-1 sm:ml-2">
          <button
            onClick={() => setShowLeaveMenu((v) => !v)}
            aria-label={isHost ? "End or leave class" : "Leave class"}
            // Icon-only square on phones: next to the four class controls
            // the label had no room and wrapped onto two lines.
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500 text-xs font-bold text-white transition active:scale-95 hover:bg-red-600 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden whitespace-nowrap sm:inline">
              {isHost ? "End / Leave" : "Leave"}
            </span>
          </button>

          {showLeaveMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLeaveMenu(false)}
              />
              <div className="absolute bottom-full right-0 z-50 mb-3 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 shadow-2xl">
                <div className="select-none px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Exit Class
                </div>
                {isHost && (
                  <button
                    onClick={() => {
                      endMeetingForAll();
                      setShowLeaveMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    End class for all
                  </button>
                )}
                <button
                  onClick={() => {
                    leaveMeeting();
                    setShowLeaveMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-white transition hover:bg-zinc-800"
                >
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  Leave class
                </button>
                <div className="my-1.5 border-t border-zinc-800" />
                <button
                  onClick={() => setShowLeaveMenu(false)}
                  className="w-full py-1 text-center text-[10px] font-semibold text-zinc-400 transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

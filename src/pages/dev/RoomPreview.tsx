import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  MeetingContext,
  type ActivePanel,
  type MeetingContextValue,
} from "@/context/MeetingContext";
import type {
  MeetingChatMessage,
  MeetingParticipant,
} from "@/lib/meetingSocket";
import { ControlBar } from "@/components/meeting/ControlBar";
import { RoomShell } from "@/components/meeting/RoomShell";
import { RoomStage } from "@/components/meeting/RoomStage";

// Layout harness for the live-class room. Not routed in production builds -
// it exists so the room's chrome can be checked at real phone sizes, with an
// arbitrary class size, without a backend, a camera or a scheduled class.
//
//   /dev/room-preview?n=8&rec=1&role=host&panel=chat
//
//   n      participants including you (default 4)
//   rec    1 = recording indicator on
//   role   host | guest (default host)
//   panel  chat | participants (default none)
//
// Tiles are numbered canvas feeds: any chrome landing on top of video is
// immediately visible against the flat colour, and the numbers make it obvious
// when a tile is clipped rather than merely small.

const NAMES = [
  "Santosh Kumar",
  "Aarti Deshpande",
  "Ravi Menon",
  "Priya Nair",
  "Imran Sheikh",
  "Lakshmi Rao",
  "Vikram Joshi",
  "Neha Kulkarni",
  "Arjun Pillai",
  "Divya Iyer",
  "Rahul Bose",
  "Meera Shah",
];

const HUES = [275, 22, 190, 140, 320, 45, 210, 0, 95, 260, 170, 35];

const makeFeed = (index: number, label: string): MediaStream => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  const draw = () => {
    if (!ctx) return;
    ctx.fillStyle = `hsl(${HUES[index % HUES.length]} 45% 32%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 160px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  };
  draw();
  // A captureStream needs frames to keep flowing or the <video> stays black.
  window.setInterval(draw, 1000);
  return canvas.captureStream(1);
};

export function RoomPreview() {
  const [params] = useSearchParams();
  const count = Math.max(1, Math.min(12, Number(params.get("n")) || 4));
  const role = params.get("role") === "guest" ? "guest" : "host";
  const [isRecording, setIsRecording] = useState(params.get("rec") === "1");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(
    params.get("panel") === "chat"
      ? "chat"
      : params.get("panel") === "participants"
        ? "participants"
        : null,
  );
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([
    {
      _id: "m1",
      classId: "preview",
      senderId: "u2",
      senderName: NAMES[1],
      message: "Namaste shikshak, my knee hurts in this pose.",
      timestamp: Date.now() - 240000,
    },
    {
      _id: "m2",
      classId: "preview",
      senderId: "u1",
      senderName: NAMES[0],
      message: "Bring the block under your thigh and keep the spine long.",
      timestamp: Date.now() - 120000,
    },
  ]);

  // Feeds are built once; regenerating them on every render restarts the
  // captureStream and flickers every tile.
  const feedsRef = useRef<MediaStream[] | null>(null);
  if (!feedsRef.current) {
    feedsRef.current = Array.from({ length: 12 }, (_, i) =>
      makeFeed(i, String(i + 1)),
    );
  }
  const feeds = feedsRef.current;

  const value = useMemo<MeetingContextValue>(() => {
    const participant = (i: number): MeetingParticipant => ({
      userId: `u${i + 1}`,
      socketId: `s${i + 1}`,
      name: NAMES[i % NAMES.length],
      role: i === 0 ? "host" : "guest",
      isMuted: i % 3 === 1,
      isVideoOff: i === 5,
      isScreenSharing: false,
      joinedAt: Date.now() - i * 1000,
    });

    const self = participant(role === "host" ? 0 : 1);
    const participants = Array.from({ length: count }, (_, i) => participant(i));
    const peers = Object.fromEntries(
      participants
        .filter((p) => p.userId !== self.userId)
        .map((p, i) => [
          p.socketId,
          { peer: null as never, stream: feeds[i + 1], participant: p },
        ]),
    );

    return {
      classId: "preview",
      role,
      self,
      participants,
      hostUserId: "u1",
      localStream: feeds[0],
      isMuted,
      isVideoOff,
      isScreenSharing,
      isRecording,
      isRecordingBusy: false,
      peers,
      chatMessages,
      unreadChat: activePanel === "chat" ? 0 : 3,
      activePanel,
      activeSpeaker: null,
      connectionState: "joined",
      toggleMute: () => setIsMuted((v) => !v),
      toggleVideo: () => setIsVideoOff((v) => !v),
      toggleScreenShare: () => setIsScreenSharing((v) => !v),
      toggleRecording: () => setIsRecording((v) => !v),
      leaveMeeting: () => undefined,
      endMeetingForAll: () => undefined,
      sendMessage: (text: string) =>
        setChatMessages((prev) => [
          ...prev,
          {
            _id: `m${prev.length + 1}`,
            classId: "preview",
            senderId: role === "host" ? "u1" : "u2",
            senderName: NAMES[0],
            message: text,
            timestamp: Date.now(),
          },
        ]),
      hostMuteParticipant: () => undefined,
      hostRemoveParticipant: () => undefined,
      setActivePanel,
    };
  }, [
    count,
    role,
    feeds,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    chatMessages,
    activePanel,
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <MeetingContext.Provider value={value}>
        <RoomShell isRecording={isRecording}>
          <RoomStage activePanel={activePanel} />
          <ControlBar />
        </RoomShell>
      </MeetingContext.Provider>
    </div>
  );
}

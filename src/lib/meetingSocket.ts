import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/apiClient";
import { getRoleToken } from "@/lib/auth";

export type MeetingRoleClient = "host" | "guest";

export type MeetingParticipant = {
  userId: string;
  socketId: string;
  name: string;
  role: MeetingRoleClient;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
};

export type MeetingChatMessage = {
  _id: string;
  classId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
};

export type ServerToClient = {
  "room-joined": (payload: {
    classId: string;
    self: MeetingParticipant;
    participants: MeetingParticipant[];
    hostUserId: string | null;
  }) => void;
  "user-connected": (payload: { participant: MeetingParticipant }) => void;
  "user-disconnected": (payload: { userId: string; socketId: string }) => void;
  "participant-update": (payload: { participants: MeetingParticipant[] }) => void;
  "meeting-ended": (payload: { message: string }) => void;

  offer: (payload: { sender_sid: string; sdp: unknown }) => void;
  answer: (payload: { sender_sid: string; sdp: unknown }) => void;
  "ice-candidate": (payload: { sender_sid: string; candidate: unknown }) => void;

  "participant-muted-status": (payload: { userId: string; isMuted: boolean }) => void;
  "participant-video-status": (payload: { userId: string; isVideoOff: boolean }) => void;
  "screen-share-status": (payload: { userId: string; isSharing: boolean }) => void;

  "message-received": (payload: MeetingChatMessage) => void;
  "mute-request": (payload: { mute: true }) => void;
  "removed-from-meeting": (payload: { message: string }) => void;
  error: (payload: { message: string }) => void;
};

export type ClientToServer = {
  "join-room": (payload: { classId: string; name: string }) => void;
  "leave-room": () => void;
  "end-meeting": () => void;

  offer: (payload: { target_sid: string; sdp: unknown }) => void;
  answer: (payload: { target_sid: string; sdp: unknown }) => void;
  "ice-candidate": (payload: { target_sid: string; candidate: unknown }) => void;

  "toggle-mute": (payload: { is_muted: boolean }) => void;
  "toggle-video": (payload: { is_video_off: boolean }) => void;
  "screen-share-start": () => void;
  "screen-share-stop": () => void;

  "send-message": (payload: { message: string }) => void;
  "mute-participant": (payload: { user_id: string }) => void;
  "remove-participant": (payload: { user_id: string }) => void;
};

export type MeetingClientSocket = Socket<ServerToClient, ClientToServer>;

export const connectMeetingSocket = (
  role: MeetingRoleClient,
): MeetingClientSocket => {
  const token =
    role === "host" ? getRoleToken("TUTOR") : getRoleToken("STUDENT");
  if (!token) {
    throw new Error(
      `Missing auth token for role ${role}. User must be logged in.`,
    );
  }

  return io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  }) as MeetingClientSocket;
};

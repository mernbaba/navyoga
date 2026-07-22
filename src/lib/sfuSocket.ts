import { io, type Socket } from "socket.io-client";
import type {
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
  IceParameters,
  IceCandidate,
  MediaKind,
} from "mediasoup-client/types";
import { API_BASE_URL } from "@/lib/apiClient";
import { getRoleToken } from "@/lib/auth";
import type { MeetingRoleClient } from "@/lib/meetingSocket";

// ---------------------------------------------------------------------------
// Client for the ISOLATED "/sfu" Socket.IO namespace (the mediasoup path).
// Kept entirely separate from meetingSocket.ts so the mesh path is untouched.
// ---------------------------------------------------------------------------

export type SfuProducerSource = "camera" | "mic" | "screen";

export type SfuParticipant = {
  userId: string;
  socketId: string;
  name: string;
  role: MeetingRoleClient;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
};

export type SfuChatMessage = {
  _id: string;
  classId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
};

export type SfuTransportParams = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};

// Ack response envelope: either the payload, or an { error } object.
type AckOk<T> = T | { error: string };

type SfuServerToClient = {
  "sfu:user-connected": (payload: { participant: SfuParticipant }) => void;
  "sfu:user-disconnected": (payload: {
    userId: string;
    socketId: string;
  }) => void;
  "sfu:participant-update": (payload: {
    participants: SfuParticipant[];
  }) => void;

  "sfu:new-producer": (payload: {
    producerId: string;
    source: SfuProducerSource;
    producerSocketId: string;
    producerUserId: string;
  }) => void;
  "sfu:producer-closed": (payload: {
    producerId: string;
    producerSocketId: string;
    source: SfuProducerSource;
  }) => void;

  "sfu:participant-muted-status": (payload: {
    userId: string;
    isMuted: boolean;
  }) => void;
  "sfu:participant-video-status": (payload: {
    userId: string;
    isVideoOff: boolean;
  }) => void;
  "sfu:screen-share-status": (payload: {
    userId: string;
    isSharing: boolean;
  }) => void;

  "sfu:message-received": (payload: SfuChatMessage) => void;
  "sfu:mute-request": (payload: { mute: true }) => void;
  "sfu:removed-from-meeting": (payload: { message: string }) => void;
  "sfu:meeting-ended": (payload: { message: string }) => void;
  "sfu:error": (payload: { message: string }) => void;
};

type SfuClientToServer = {
  "sfu:join-room": (
    payload: { classId: string; name: string },
    ack: (
      res: AckOk<{
        self: SfuParticipant;
        participants: SfuParticipant[];
        hostUserId: string | null;
        rtpCapabilities: RtpCapabilities;
      }>,
    ) => void,
  ) => void;

  "sfu:create-transport": (
    payload: { direction: "send" | "recv" },
    ack: (res: AckOk<SfuTransportParams>) => void,
  ) => void;

  "sfu:connect-transport": (
    payload: { direction: "send" | "recv"; dtlsParameters: DtlsParameters },
    ack: (res: AckOk<{ ok: true }>) => void,
  ) => void;

  "sfu:produce": (
    payload: {
      kind: MediaKind;
      rtpParameters: RtpParameters;
      source: SfuProducerSource;
    },
    ack: (res: AckOk<{ id: string }>) => void,
  ) => void;

  "sfu:consume": (
    payload: { producerId: string; rtpCapabilities: RtpCapabilities },
    ack: (
      res: AckOk<{
        id: string;
        producerId: string;
        kind: MediaKind;
        rtpParameters: RtpParameters;
        source: SfuProducerSource;
        producerSocketId: string;
        producerUserId: string;
      }>,
    ) => void,
  ) => void;

  "sfu:resume-consumer": (
    payload: { consumerId: string },
    ack: (res: AckOk<{ ok: true }>) => void,
  ) => void;

  "sfu:list-producers": (
    payload: Record<string, never>,
    ack: (
      res: AckOk<{
        producers: {
          producerId: string;
          source: SfuProducerSource;
          producerSocketId: string;
          producerUserId: string;
        }[];
      }>,
    ) => void,
  ) => void;

  "sfu:close-producer": (
    payload: { source: SfuProducerSource },
    ack: (res: AckOk<{ ok: true }>) => void,
  ) => void;

  "sfu:toggle-mute": (payload: { is_muted: boolean }) => void;
  "sfu:toggle-video": (payload: { is_video_off: boolean }) => void;
  "sfu:leave-room": () => void;
  "sfu:end-meeting": () => void;
  "sfu:send-message": (payload: { message: string }) => void;
  "sfu:mute-participant": (payload: { user_id: string }) => void;
  "sfu:remove-participant": (payload: { user_id: string }) => void;
};

export type SfuClientSocket = Socket<SfuServerToClient, SfuClientToServer>;

// A small promise wrapper around Socket.IO acks so signalling reads top-to-
// bottom in the context. Rejects if the server returned { error }, and also
// rejects after a timeout so a dropped connection / dead server can never hang
// the join flow forever on a promise that will never settle.
export const emitWithAck = <T>(
  socket: SfuClientSocket,
  event: keyof SfuClientToServer,
  payload: unknown,
  timeoutMs = 15000,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${String(event)} timed out`));
    }, timeoutMs);

    // socket.io types don't narrow the generic ack easily here; the runtime
    // shape is validated by the AckOk check below.
    (socket.emit as (e: string, p: unknown, cb: (r: AckOk<T>) => void) => void)(
      event as string,
      payload,
      (res: AckOk<T>) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (res && typeof res === "object" && "error" in res) {
          reject(new Error((res as { error: string }).error));
        } else {
          resolve(res as T);
        }
      },
    );
  });

export const connectSfuSocket = (role: MeetingRoleClient): SfuClientSocket => {
  const token =
    role === "host" ? getRoleToken("TUTOR") : getRoleToken("STUDENT");
  if (!token) {
    throw new Error(
      `Missing auth token for role ${role}. User must be logged in.`,
    );
  }

  // Note the "/sfu" namespace suffix on the URL - this connects to the
  // dedicated mediasoup namespace, NOT the default mesh namespace.
  return io(`${API_BASE_URL}/sfu`, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  }) as SfuClientSocket;
};

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

// sfu:join-room either admits us into the class or - only while the yoga
// shikshak (host) has yet to start it - parks us in the waiting room.
// STUN/TURN servers the server tells us to use. Without a TURN relay a client
// on symmetric NAT can finish signalling but never exchange media, which looks
// exactly like "I'm in the class but nobody can see or hear me".
export type SfuIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type SfuJoinResult =
  | { status: "waiting"; waitingCount: number }
  | {
      status: "joined";
      self: SfuParticipant;
      participants: SfuParticipant[];
      hostUserId: string | null;
      rtpCapabilities: RtpCapabilities;
      iceServers?: SfuIceServer[];
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

  // ----- Waiting room -------------------------------------------------------
  "sfu:waiting-update": (payload: { waitingCount: number }) => void;
  // The host started the class - re-run sfu:join-room to be let in.
  "sfu:host-joined": (payload: Record<string, never>) => void;

  // The room's host slot moved to the tutor the class is actually assigned to.
  "sfu:host-changed": (payload: { hostUserId: string | null }) => void;

  "sfu:message-received": (payload: SfuChatMessage) => void;
  "sfu:mute-request": (payload: { mute: true }) => void;
  "sfu:removed-from-meeting": (payload: { message: string }) => void;
  "sfu:meeting-ended": (payload: { message: string }) => void;
  "sfu:error": (payload: { message: string }) => void;
};

type SfuClientToServer = {
  "sfu:join-room": (
    payload: { classId: string; name: string },
    ack: (res: AckOk<SfuJoinResult>) => void,
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

  // Read-only "has the class started yet?" poll, used as a safety net for the
  // one-shot sfu:host-joined broadcast while sitting in the waiting room.
  "sfu:waiting-status": (
    payload: { classId: string },
    ack: (res: AckOk<{ started: boolean; waitingCount: number }>) => void,
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
    const finish = () => {
      settled = true;
      window.clearTimeout(timer);
      socket.off("disconnect", onDisconnect);
    };
    // A request in flight when the socket drops would otherwise sit here for the
    // full timeout, holding the join flow open long enough for the reconnect
    // that follows to be ignored. Fail it immediately instead so the caller can
    // retry on the fresh connection.
    const onDisconnect = () => {
      if (settled) return;
      finish();
      reject(new Error(`${String(event)}: disconnected`));
    };
    const timer = window.setTimeout(() => {
      if (settled) return;
      finish();
      reject(new Error(`${String(event)} timed out`));
    }, timeoutMs);
    socket.on("disconnect", onDisconnect);

    // socket.io types don't narrow the generic ack easily here; the runtime
    // shape is validated by the AckOk check below.
    (socket.emit as (e: string, p: unknown, cb: (r: AckOk<T>) => void) => void)(
      event as string,
      payload,
      (res: AckOk<T>) => {
        if (settled) return;
        finish();
        if (res && typeof res === "object" && "error" in res) {
          reject(new Error((res as { error: string }).error));
        } else {
          resolve(res as T);
        }
      },
    );
  });

export const connectSfuSocket = (role: MeetingRoleClient): SfuClientSocket => {
  const readToken = () =>
    role === "host" ? getRoleToken("TUTOR") : getRoleToken("STUDENT");

  if (!readToken()) {
    throw new Error(
      `Missing auth token for role ${role}. User must be logged in.`,
    );
  }

  // Note the "/sfu" namespace suffix on the URL - this connects to the
  // dedicated mediasoup namespace, NOT the default mesh namespace.
  return io(`${API_BASE_URL}/sfu`, {
    // A function, not a static object: socket.io calls this fresh on every
    // (re)connect attempt, so a token that rotated/expired mid-session is
    // re-read from storage instead of the client hammering the server with
    // the same now-dead token forever.
    auth: (cb) => cb({ token: readToken() }),
    // Match the server's fallback (index.ts) so a wifi/cellular handoff that
    // can't complete a websocket upgrade can still ride through on polling.
    transports: ["websocket", "polling"],
    autoConnect: true,
  }) as SfuClientSocket;
};

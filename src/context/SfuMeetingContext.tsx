import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Device } from "mediasoup-client";
import type {
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
} from "mediasoup-client/types";
import { toast } from "sonner";
import { registerAudioContext } from "@/lib/audioUnlock";
import {
  MeetingContext,
  type MeetingContextValue,
} from "@/context/MeetingContext";
import {
  connectSfuSocket,
  emitWithAck,
  type SfuChatMessage,
  type SfuClientSocket,
  type SfuParticipant,
  type SfuProducerSource,
  type SfuTransportParams,
} from "@/lib/sfuSocket";
import type { MeetingRoleClient } from "@/lib/meetingSocket";

// A remote peer as the UI expects it: one aggregated MediaStream per remote
// participant (all their consumer tracks merged), plus their metadata. This
// mirrors the mesh RemotePeer shape so VideoGrid/VideoTile work unchanged.
type SfuRemotePeer = {
  stream: MediaStream | null;
  participant: SfuParticipant;
};

export type ActivePanel = "participants" | "chat" | null;

// Deliberately identical to the mesh MeetingContextValue so the shared UI
// components can consume either provider via useMeeting-shaped hooks. Recording
// is a no-op stub on the SFU path for now (mesh-only feature).
export type SfuMeetingContextValue = {
  classId: string;
  role: MeetingRoleClient;
  self: SfuParticipant | null;
  participants: SfuParticipant[];
  hostUserId: string | null;
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isRecordingBusy: boolean;
  peers: Record<string, SfuRemotePeer>;
  chatMessages: SfuChatMessage[];
  unreadChat: number;
  activePanel: ActivePanel;
  activeSpeaker: string | null;
  connectionState: "connecting" | "joined" | "ended";

  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  leaveMeeting: () => void;
  endMeetingForAll: () => void;
  sendMessage: (text: string) => void;
  hostMuteParticipant: (userId: string) => void;
  hostRemoveParticipant: (userId: string) => void;
  setActivePanel: (panel: ActivePanel) => void;
};

const SfuMeetingContext = createContext<SfuMeetingContextValue | null>(null);

type ProviderProps = {
  classId: string;
  role: MeetingRoleClient;
  displayName: string;
  onLeave: () => void;
  children: ReactNode;
};

export const SfuMeetingProvider = ({
  classId,
  role,
  displayName,
  onLeave,
  children,
}: ProviderProps) => {
  const [self, setSelf] = useState<SfuParticipant | null>(null);
  const [participants, setParticipants] = useState<SfuParticipant[]>([]);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peers, setPeers] = useState<Record<string, SfuRemotePeer>>({});
  const [chatMessages, setChatMessages] = useState<SfuChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [activePanel, setActivePanelState] = useState<ActivePanel>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "joined" | "ended"
  >("connecting");

  const socketRef = useRef<SfuClientSocket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);

  // Local media
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Producers we're sending, keyed by logical source.
  const producersRef = useRef<Record<SfuProducerSource, Producer | null>>({
    camera: null,
    mic: null,
    screen: null,
  });

  // Consumers we're receiving, keyed by consumer id.
  const consumersRef = useRef<Record<string, Consumer>>({});
  // producerId -> the consumer/track/owner it produced, so a producer-closed
  // event removes EXACTLY that track (not "any track of this kind"), which
  // matters when a camera/screen restarts and a new producer replaces an old.
  const producerConsumerRef = useRef<
    Record<
      string,
      { consumerId: string; socketId: string; track: MediaStreamTrack }
    >
  >({});
  // producerIds we've started consuming, to dedupe concurrent consume attempts
  // (list-producers at join can race a new-producer event for the same id).
  const consumingProducerIdsRef = useRef<Set<string>>(new Set());
  // new-producer events that arrive before the recv transport is ready are
  // queued here and drained once transports exist.
  const pendingProducersRef = useRef<
    { producerId: string; producerSocketId: string; producerUserId: string }[]
  >([]);
  // The aggregated MediaStream per remote socketId (all their tracks).
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const peersRef = useRef<Record<string, SfuRemotePeer>>({});
  const audioCtxRef = useRef<Record<string, AudioContext>>({});

  const teardownStartedRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const onLeaveRef = useRef(onLeave);
  const activePanelRef = useRef<ActivePanel>(null);
  const selfRef = useRef<SfuParticipant | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);
  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);
  useEffect(() => {
    selfRef.current = self;
  }, [self]);
  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  const setActivePanel = useCallback((panel: ActivePanel) => {
    if (panel === "chat") setUnreadChat(0);
    setActivePanelState(panel);
  }, []);

  // Voice-activity detection for the active-speaker highlight, identical in
  // spirit to the mesh path.
  const setupActiveSpeaker = useCallback(
    (id: string, stream: MediaStream) => {
      try {
        if (stream.getAudioTracks().length === 0) return;
        // Only ever run ONE analyser per id. Without this guard, every track
        // re-attach (camera restart, etc.) would spawn another perpetual timer
        // and leak an AudioContext (browsers cap ~6, after which new() throws).
        if (audioCtxRef.current[id]) return;
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        registerAudioContext(ctx);
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioCtxRef.current[id] = ctx;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          // Stop if this ctx was replaced/closed (identity check, not just
          // truthiness) so an orphaned loop can never run forever.
          if (audioCtxRef.current[id] !== ctx) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] ?? 0;
          const avg = sum / data.length;
          if (avg > 18) setActiveSpeaker(id);
          setTimeout(tick, 500);
        };
        tick();
      } catch {
        // analyser optional
      }
    },
    [],
  );

  // Rebuild the peers state object from the refs (called whenever streams or
  // participant metadata change).
  const publishPeers = useCallback(() => {
    setPeers({ ...peersRef.current });
  }, []);

  // Attach a freshly received consumer track to the aggregated remote stream
  // for its owner, creating the peer entry if needed.
  const attachConsumerTrack = useCallback(
    (
      socketId: string,
      producerId: string,
      consumerId: string,
      track: MediaStreamTrack,
      participant: SfuParticipant,
    ) => {
      let stream = remoteStreamsRef.current[socketId];
      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current[socketId] = stream;
      }
      // Drop any prior track of the same kind (e.g. camera restart) so the
      // stream carries at most one audio + one video track.
      stream.getTracks().forEach((t) => {
        if (t.kind === track.kind) stream.removeTrack(t);
      });
      stream.addTrack(track);

      // Record which producer this track came from so producer-closed can
      // remove exactly this track later.
      producerConsumerRef.current[producerId] = {
        consumerId,
        socketId,
        track,
      };

      const existing = peersRef.current[socketId];
      peersRef.current[socketId] = {
        // Fresh MediaStream reference so VideoTile re-binds srcObject.
        stream: new MediaStream(stream.getTracks()),
        participant: existing?.participant ?? participant,
      };
      setupActiveSpeaker(socketId, stream);
      publishPeers();
    },
    [publishPeers, setupActiveSpeaker],
  );

  // Consume a single remote producer end-to-end: ask the server, build the
  // local consumer, resume it, and wire the track into the UI.
  const consumeProducer = useCallback(
    async (
      producerId: string,
      producerSocketId: string,
      producerUserId: string,
    ) => {
      const socket = socketRef.current;
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;
      if (!socket || !device || !recvTransport) return;

      // Dedupe: list-producers at join can race a new-producer event for the
      // same id. Only consume each producer once.
      if (consumingProducerIdsRef.current.has(producerId)) return;
      consumingProducerIdsRef.current.add(producerId);

      try {
        const params = await emitWithAck<{
          id: string;
          producerId: string;
          kind: "audio" | "video";
          rtpParameters: import("mediasoup-client/types").RtpParameters;
          source: SfuProducerSource;
          producerSocketId: string;
          producerUserId: string;
        }>(socket, "sfu:consume", {
          producerId,
          rtpCapabilities: device.rtpCapabilities,
        });

        const consumer = await recvTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });
        consumersRef.current[consumer.id] = consumer;

        // Resume the server-side consumer now that ours exists.
        await emitWithAck(socket, "sfu:resume-consumer", {
          consumerId: consumer.id,
        });

        const participant =
          peersRef.current[producerSocketId]?.participant ??
          participants.find((p) => p.socketId === producerSocketId) ??
          ({
            userId: producerUserId,
            socketId: producerSocketId,
            name: "Participant",
            role: "guest",
            isMuted: false,
            isVideoOff: false,
            isScreenSharing: false,
            joinedAt: Date.now(),
          } as SfuParticipant);

        attachConsumerTrack(
          producerSocketId,
          producerId,
          consumer.id,
          consumer.track,
          participant,
        );
      } catch (err) {
        console.error("[sfu] consume failed", err);
        // Allow a later retry of this producer if consuming failed.
        consumingProducerIdsRef.current.delete(producerId);
      }
    },
    [attachConsumerTrack, participants],
  );

  // Create both send and recv transports and wire their connect/produce
  // callbacks to the signalling channel.
  const createTransports = useCallback(async () => {
    const socket = socketRef.current;
    const device = deviceRef.current;
    if (!socket || !device) return;

    // --- Send transport ---
    const sendParams = await emitWithAck<SfuTransportParams>(
      socket,
      "sfu:create-transport",
      { direction: "send" },
    );
    const sendTransport = device.createSendTransport(sendParams);
    sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
      emitWithAck(socket, "sfu:connect-transport", {
        direction: "send",
        dtlsParameters,
      })
        .then(() => callback())
        .catch((e) => errback(e as Error));
    });
    sendTransport.on(
      "produce",
      ({ kind, rtpParameters, appData }, callback, errback) => {
        const source = (appData as { source?: SfuProducerSource }).source;
        emitWithAck<{ id: string }>(socket, "sfu:produce", {
          kind,
          rtpParameters,
          source: source ?? "camera",
        })
          .then((res) => callback({ id: res.id }))
          .catch((e) => errback(e as Error));
      },
    );
    sendTransportRef.current = sendTransport;

    // --- Recv transport ---
    const recvParams = await emitWithAck<SfuTransportParams>(
      socket,
      "sfu:create-transport",
      { direction: "recv" },
    );
    const recvTransport = device.createRecvTransport(recvParams);
    recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
      emitWithAck(socket, "sfu:connect-transport", {
        direction: "recv",
        dtlsParameters,
      })
        .then(() => callback())
        .catch((e) => errback(e as Error));
    });
    recvTransportRef.current = recvTransport;
  }, []);

  // Produce a specific local track on the send transport under a logical source.
  const produceTrack = useCallback(
    async (track: MediaStreamTrack, source: SfuProducerSource) => {
      const sendTransport = sendTransportRef.current;
      if (!sendTransport) return;
      // Close any existing producer for this source first.
      const prev = producersRef.current[source];
      if (prev) {
        try {
          prev.close();
        } catch {
          // ignore
        }
        producersRef.current[source] = null;
      }
      const producer = await sendTransport.produce({
        track,
        appData: { source },
      });
      producersRef.current[source] = producer;
    },
    [],
  );

  const updateLocalAudioState = useCallback((muted: boolean) => {
    setIsMuted(muted);
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !muted;
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    updateLocalAudioState(next);
    socketRef.current?.emit("sfu:toggle-mute", { is_muted: next });
  }, [isMuted, updateLocalAudioState]);

  // Camera on/off. On: acquire a fresh camera track and produce it. Off: stop
  // the track and close the camera producer (releases the device + LED).
  const toggleVideo = useCallback(async () => {
    const socket = socketRef.current;
    const local = localStreamRef.current;
    if (!local || !socket) return;

    if (!isVideoOff) {
      // Turn OFF
      const track = local.getVideoTracks()[0];
      if (track) {
        track.stop();
        local.removeTrack(track);
      }
      const cam = producersRef.current.camera;
      if (cam) {
        try {
          cam.close();
        } catch {
          // ignore
        }
        producersRef.current.camera = null;
        socket.emit("sfu:close-producer", { source: "camera" }, () => {});
      }
      localStreamRef.current = new MediaStream(local.getTracks());
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      setIsVideoOff(true);
      socket.emit("sfu:toggle-video", { is_video_off: true });
      return;
    }

    // Turn ON
    let camStream: MediaStream;
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      toast.error("Couldn't access the camera");
      setIsVideoOff(true);
      return;
    }
    const newTrack = camStream.getVideoTracks()[0];
    if (!newTrack) {
      camStream.getTracks().forEach((t) => t.stop());
      setIsVideoOff(true);
      return;
    }
    const current = localStreamRef.current ?? local;
    current.getVideoTracks().forEach((t) => {
      t.stop();
      current.removeTrack(t);
    });
    current.addTrack(newTrack);
    localStreamRef.current = new MediaStream(current.getTracks());
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    setIsVideoOff(false);
    socket.emit("sfu:toggle-video", { is_video_off: false });
    await produceTrack(newTrack, "camera");
  }, [isVideoOff, produceTrack]);

  const toggleScreenShare = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket) return;

    if (isScreenSharingRef.current) {
      const stream = screenStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      const screenProducer = producersRef.current.screen;
      if (screenProducer) {
        try {
          screenProducer.close();
        } catch {
          // ignore
        }
        producersRef.current.screen = null;
        socket.emit("sfu:close-producer", { source: "screen" }, () => {});
      }
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
      return;
    }

    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = display;
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) {
        display.getTracks().forEach((t) => t.stop());
        return;
      }
      await produceTrack(screenTrack, "screen");
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      screenTrack.onended = () => {
        toggleScreenShare();
      };
    } catch {
      toast.error("Screen share canceled");
    }
  }, [produceTrack]);

  // Recording is not wired on the SFU path yet (mesh-only feature for now).
  const toggleRecording = useCallback(() => {
    toast.message("Recording isn't available on the new (SFU) meeting yet");
  }, []);

  const destroyRemote = useCallback(
    (socketId: string) => {
      const stream = remoteStreamsRef.current[socketId];
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        delete remoteStreamsRef.current[socketId];
      }
      const ctx = audioCtxRef.current[socketId];
      if (ctx) {
        ctx.close().catch(() => undefined);
        delete audioCtxRef.current[socketId];
      }
      // Drop this peer's producer/consumer bookkeeping so their producerIds can
      // be consumed afresh if they rejoin.
      for (const [producerId, m] of Object.entries(
        producerConsumerRef.current,
      )) {
        if (m.socketId === socketId) {
          const consumer = consumersRef.current[m.consumerId];
          if (consumer) {
            try {
              consumer.close();
            } catch {
              // ignore
            }
            delete consumersRef.current[m.consumerId];
          }
          consumingProducerIdsRef.current.delete(producerId);
          delete producerConsumerRef.current[producerId];
        }
      }
      delete peersRef.current[socketId];
      publishPeers();
    },
    [publishPeers],
  );

  const teardown = useCallback(() => {
    if (teardownStartedRef.current) return;
    teardownStartedRef.current = true;

    if (socketRef.current) {
      try {
        socketRef.current.emit("sfu:leave-room");
        socketRef.current.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }

    Object.values(producersRef.current).forEach((p) => {
      try {
        p?.close();
      } catch {
        // ignore
      }
    });
    producersRef.current = { camera: null, mic: null, screen: null };

    Object.values(consumersRef.current).forEach((c) => {
      try {
        c.close();
      } catch {
        // ignore
      }
    });
    consumersRef.current = {};
    producerConsumerRef.current = {};
    consumingProducerIdsRef.current = new Set();
    pendingProducersRef.current = [];

    try {
      sendTransportRef.current?.close();
    } catch {
      // ignore
    }
    try {
      recvTransportRef.current?.close();
    } catch {
      // ignore
    }
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    deviceRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    Object.values(remoteStreamsRef.current).forEach((s) =>
      s.getTracks().forEach((t) => t.stop()),
    );
    remoteStreamsRef.current = {};
    Object.values(audioCtxRef.current).forEach((ctx) =>
      ctx.close().catch(() => undefined),
    );
    audioCtxRef.current = {};
    peersRef.current = {};

    setPeers({});
    setLocalStream(null);
    setParticipants([]);
    setSelf(null);
    setHostUserId(null);
    setConnectionState("ended");
  }, []);

  const leaveMeeting = useCallback(() => {
    teardown();
    onLeaveRef.current();
  }, [teardown]);

  const endMeetingForAll = useCallback(() => {
    socketRef.current?.emit("sfu:end-meeting");
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    socketRef.current?.emit("sfu:send-message", { message: trimmed });
  }, []);

  const hostMuteParticipant = useCallback((userId: string) => {
    socketRef.current?.emit("sfu:mute-participant", { user_id: userId });
  }, []);

  const hostRemoveParticipant = useCallback((userId: string) => {
    socketRef.current?.emit("sfu:remove-participant", { user_id: userId });
  }, []);

  useEffect(() => {
    let cancelled = false;
    teardownStartedRef.current = false;
    seenMessageIdsRef.current = new Set();
    producerConsumerRef.current = {};
    consumingProducerIdsRef.current = new Set();
    pendingProducersRef.current = [];

    const bootstrap = async () => {
      // Acquire mic (kept, muted) + camera (stopped, off) up front - same
      // default-off behaviour as the mesh path.
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          toast.message("Camera unavailable - joined audio-only");
        } catch {
          toast.error("Camera and microphone blocked. You can't join.");
          onLeaveRef.current();
          return;
        }
      }
      if (cancelled || !stream) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = false;
      setIsMuted(true);
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.stop();
      if (videoTrack) stream.removeTrack(videoTrack);
      setIsVideoOff(true);

      localStreamRef.current = new MediaStream(stream.getTracks());
      setLocalStream(new MediaStream(stream.getTracks()));

      let socket: SfuClientSocket;
      try {
        socket = connectSfuSocket(role);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not connect to class",
        );
        onLeaveRef.current();
        return;
      }
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        toast.error(`Connection failed: ${err.message}`);
      });
      socket.on("sfu:error", (payload) => toast.error(payload.message));

      // Server events -------------------------------------------------------
      socket.on("sfu:user-connected", ({ participant }) => {
        setParticipants((prev) =>
          prev.some((p) => p.socketId === participant.socketId)
            ? prev
            : [...prev, participant],
        );
      });

      socket.on("sfu:user-disconnected", ({ socketId }) => {
        destroyRemote(socketId);
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      socket.on("sfu:participant-update", ({ participants: list }) => {
        setParticipants(list);
        list.forEach((p) => {
          const entry = peersRef.current[p.socketId];
          if (entry) {
            peersRef.current[p.socketId] = { ...entry, participant: p };
          }
        });
        publishPeers();
      });

      socket.on(
        "sfu:new-producer",
        ({ producerId, producerSocketId, producerUserId }) => {
          // If the recv transport isn't up yet (event arrived mid-bootstrap),
          // queue it; the join flow drains the queue once transports exist.
          if (!recvTransportRef.current) {
            pendingProducersRef.current.push({
              producerId,
              producerSocketId,
              producerUserId,
            });
            return;
          }
          void consumeProducer(producerId, producerSocketId, producerUserId);
        },
      );

      socket.on("sfu:producer-closed", ({ producerId, producerSocketId }) => {
        // Remove EXACTLY the track this producer produced (matched by
        // producerId), never "any track of this kind" - otherwise a
        // camera/screen restart, whose new track has already been attached,
        // could be wiped by a late close event for the OLD producer.
        const mapping = producerConsumerRef.current[producerId];
        consumingProducerIdsRef.current.delete(producerId);
        delete producerConsumerRef.current[producerId];
        if (!mapping) return;
        const stream = remoteStreamsRef.current[producerSocketId];
        if (!stream) return;
        // Only remove the track if it's still the one on the stream (a restart
        // may already have swapped in a newer track of the same kind).
        if (stream.getTracks().includes(mapping.track)) {
          try {
            mapping.track.stop();
          } catch {
            // ignore
          }
          stream.removeTrack(mapping.track);
        }
        const existing = peersRef.current[producerSocketId];
        if (existing) {
          peersRef.current[producerSocketId] = {
            ...existing,
            stream: new MediaStream(stream.getTracks()),
          };
          publishPeers();
        }
      });

      socket.on("sfu:participant-muted-status", ({ userId, isMuted: m }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isMuted: m } : p)),
        );
      });
      socket.on("sfu:participant-video-status", ({ userId, isVideoOff: v }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isVideoOff: v } : p)),
        );
      });
      socket.on("sfu:screen-share-status", ({ userId, isSharing }) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, isScreenSharing: isSharing } : p,
          ),
        );
      });

      socket.on("sfu:message-received", (msg) => {
        if (seenMessageIdsRef.current.has(msg._id)) return;
        seenMessageIdsRef.current.add(msg._id);
        setChatMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
        );
        const isMine = msg.senderId === selfRef.current?.userId;
        if (!isMine && activePanelRef.current !== "chat") {
          setUnreadChat((n) => n + 1);
        }
      });

      socket.on("sfu:mute-request", () => {
        toast.message("The host muted your microphone");
        updateLocalAudioState(true);
        socketRef.current?.emit("sfu:toggle-mute", { is_muted: true });
      });

      socket.on("sfu:removed-from-meeting", (data) => {
        toast.error(data.message);
        teardown();
        onLeaveRef.current();
      });
      socket.on("sfu:meeting-ended", (data) => {
        toast.message(data.message);
        teardown();
        onLeaveRef.current();
      });

      // Join flow: join -> load device -> transports -> produce mic ->
      // consume everyone already in the room. ------------------------------
      try {
        const joinRes = await emitWithAck<{
          self: SfuParticipant;
          participants: SfuParticipant[];
          hostUserId: string | null;
          rtpCapabilities: RtpCapabilities;
        }>(socket, "sfu:join-room", { classId, name: displayName });
        if (cancelled) return;

        setSelf(joinRes.self);
        setParticipants(joinRes.participants);
        setHostUserId(joinRes.hostUserId);

        const device = new Device();
        await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
        deviceRef.current = device;

        await createTransports();
        if (cancelled) return;

        setConnectionState("joined");

        // Publish the mic track (kept but muted). Producing it means remote
        // peers can hear us the instant we unmute - no renegotiation needed.
        const micTrack = localStreamRef.current?.getAudioTracks()[0];
        if (micTrack && device.canProduce("audio")) {
          await produceTrack(micTrack, "mic");
        }

        // Consume every producer that already exists in the room.
        const { producers } = await emitWithAck<{
          producers: {
            producerId: string;
            source: SfuProducerSource;
            producerSocketId: string;
            producerUserId: string;
          }[];
        }>(socket, "sfu:list-producers", {});
        for (const p of producers) {
          await consumeProducer(
            p.producerId,
            p.producerSocketId,
            p.producerUserId,
          );
        }

        // Drain any new-producer events that arrived while we were still
        // setting up transports. consumeProducer dedupes by producerId, so
        // overlap with the list-producers set above is harmless.
        const queued = pendingProducersRef.current;
        pendingProducersRef.current = [];
        for (const p of queued) {
          await consumeProducer(
            p.producerId,
            p.producerSocketId,
            p.producerUserId,
          );
        }
      } catch (err) {
        console.error("[sfu] join flow failed", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to join the class",
        );
        teardown();
        onLeaveRef.current();
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, role, displayName]);

  const value = useMemo<SfuMeetingContextValue>(
    () => ({
      classId,
      role,
      self,
      participants,
      hostUserId,
      localStream,
      isMuted,
      isVideoOff,
      isScreenSharing,
      isRecording: false,
      isRecordingBusy: false,
      peers,
      chatMessages,
      unreadChat,
      activePanel,
      activeSpeaker,
      connectionState,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      toggleRecording,
      leaveMeeting,
      endMeetingForAll,
      sendMessage,
      hostMuteParticipant,
      hostRemoveParticipant,
      setActivePanel,
    }),
    [
      classId,
      role,
      self,
      participants,
      hostUserId,
      localStream,
      isMuted,
      isVideoOff,
      isScreenSharing,
      peers,
      chatMessages,
      unreadChat,
      activePanel,
      activeSpeaker,
      connectionState,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      toggleRecording,
      leaveMeeting,
      endMeetingForAll,
      sendMessage,
      hostMuteParticipant,
      hostRemoveParticipant,
      setActivePanel,
    ],
  );

  // Also expose the value through the shared MeetingContext so the existing
  // meeting UI components (VideoGrid, ControlBar, ParticipantList, ChatPanel,
  // AudioUnlockOverlay) render against the SFU session unchanged. The value is
  // structurally compatible; peers carry { stream, participant } which is all
  // those components read. The cast bridges the mesh RemotePeer type (which also
  // has a simple-peer `peer` field the UI never touches).
  return (
    <SfuMeetingContext.Provider value={value}>
      <MeetingContext.Provider
        value={value as unknown as MeetingContextValue}
      >
        {children}
      </MeetingContext.Provider>
    </SfuMeetingContext.Provider>
  );
};

export const useSfuMeeting = (): SfuMeetingContextValue => {
  const ctx = useContext(SfuMeetingContext);
  if (!ctx)
    throw new Error("useSfuMeeting must be used within SfuMeetingProvider");
  return ctx;
};

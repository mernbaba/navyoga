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
  RtpParameters,
} from "mediasoup-client/types";
import { toast } from "sonner";
import { registerAudioContext } from "@/lib/audioUnlock";
import {
  requestTutorRecordingPresign,
  saveTutorRecording,
} from "@/api/live";
import { useRecordingUploadsOptional } from "@/context/RecordingUploadContext";
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
// participant (mic + the video being presented), plus their metadata. This
// mirrors the mesh RemotePeer shape so VideoGrid/VideoTile work unchanged.
type SfuRemotePeer = {
  stream: MediaStream | null;
  participant: SfuParticipant;
};

// The remote tracks we hold for one participant, keyed by logical source.
// Unlike the mesh (where a peer's single video sender is replaceTrack'd), the
// SFU delivers camera and screen as SEPARATE tracks that can coexist - so we
// keep them all and compose "what the tile shows" deterministically: the
// screen while they share, else the camera.
type RemoteTrackSet = Partial<Record<SfuProducerSource, MediaStreamTrack>>;

// Same guest capture cap as the mesh. Even though an SFU client uploads only
// once, every student tile still renders small and the DOWNLINK of everyone
// else scales with each sender's bitrate - so keep student video modest. The
// host stays uncapped: their video is the main tile and what the recording
// compositor draws.
const GUEST_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 640, max: 640 },
  height: { ideal: 360, max: 360 },
  frameRate: { ideal: 15, max: 15 },
};

export type ActivePanel = "participants" | "chat" | null;

// Deliberately identical to the mesh MeetingContextValue so the shared UI
// components can consume either provider via useMeeting-shaped hooks.
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
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingBusy, setIsRecordingBusy] = useState(false);
  const [peers, setPeers] = useState<Record<string, SfuRemotePeer>>({});
  const [chatMessages, setChatMessages] = useState<SfuChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [activePanel, setActivePanelState] = useState<ActivePanel>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "joined" | "ended"
  >("connecting");

  // Drives the recording upload progress shown in the tutor's "My Classes"
  // table. Optional so the meeting still works if mounted outside the provider.
  const recordingUploads = useRecordingUploadsOptional();
  const recordingUploadsRef = useRef(recordingUploads);
  useEffect(() => {
    recordingUploadsRef.current = recordingUploads;
  }, [recordingUploads]);

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
  // producerId -> everything needed to tear down EXACTLY that producer's track
  // later (which consumer it fed, whose tile, which source slot). Matching by
  // producerId matters when a camera/screen restarts and a new producer
  // replaces an old one whose close event arrives late.
  const producerInfoRef = useRef<
    Record<
      string,
      {
        consumerId: string;
        socketId: string;
        source: SfuProducerSource;
        track: MediaStreamTrack;
      }
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
  // Per-remote-participant tracks by source, and the composed MediaStream the
  // tile currently renders.
  const remoteTracksRef = useRef<Record<string, RemoteTrackSet>>({});
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const peersRef = useRef<Record<string, SfuRemotePeer>>({});
  const audioCtxRef = useRef<Record<string, AudioContext>>({});

  const teardownStartedRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const isMutedRef = useRef(true);
  const videoBusyRef = useRef(false);
  const onLeaveRef = useRef(onLeave);
  const activePanelRef = useRef<ActivePanel>(null);
  const selfRef = useRef<SfuParticipant | null>(null);
  const participantsRef = useRef<SfuParticipant[]>([]);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // Recording (ported from the mesh MeetingContext; it only touches LOCAL
  // tracks + the presign upload APIs, so it works identically under the SFU).
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingMimeRef = useRef<string>("video/webm");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositorVideoRef = useRef<HTMLVideoElement | null>(null);
  const compositorRafRef = useRef<number | null>(null);
  const compositorTrackIdRef = useRef<string | null>(null);
  const syncRecordingSourcesRef = useRef<(() => void) | null>(null);
  const startRecordingRef = useRef<((auto?: boolean) => void) | null>(null);

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

  // Single write-path for participants so the ref NEVER lags the state. The
  // socket handlers (registered once) read the ref, which sidesteps the stale
  // closure that used to label freshly-consumed tracks "Participant".
  const setParticipantsSynced = useCallback(
    (
      next:
        | SfuParticipant[]
        | ((prev: SfuParticipant[]) => SfuParticipant[]),
    ) => {
      const value =
        typeof next === "function" ? next(participantsRef.current) : next;
      participantsRef.current = value;
      setParticipants(value);
    },
    [],
  );

  const setActivePanel = useCallback((panel: ActivePanel) => {
    if (panel === "chat") setUnreadChat(0);
    setActivePanelState(panel);
  }, []);

  // Voice-activity detection for the active-speaker highlight, identical in
  // spirit to the mesh path.
  const setupActiveSpeaker = useCallback((id: string, stream: MediaStream) => {
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
  }, []);

  // Rebuild the peers state object from the refs (called whenever streams or
  // participant metadata change).
  const publishPeers = useCallback(() => {
    setPeers({ ...peersRef.current });
  }, []);

  // Re-derive the single MediaStream a remote tile renders from the tracks we
  // hold for that participant: mic + (screen while sharing, else camera). This
  // is what makes the camera feed COME BACK when a screen share ends - the
  // camera track is still being consumed, it just wasn't being displayed.
  const recomposePeerStream = useCallback(
    (socketId: string) => {
      const tracks = remoteTracksRef.current[socketId];
      const existing = peersRef.current[socketId];
      const participant =
        existing?.participant ??
        participantsRef.current.find((p) => p.socketId === socketId);
      if (!tracks || !participant) return;

      const list: MediaStreamTrack[] = [];
      if (tracks.mic) list.push(tracks.mic);
      const video = tracks.screen ?? tracks.camera;
      if (video) list.push(video);

      const stream = new MediaStream(list);
      remoteStreamsRef.current[socketId] = stream;
      peersRef.current[socketId] = { stream, participant };
      if (tracks.mic) setupActiveSpeaker(socketId, stream);
      publishPeers();
    },
    [publishPeers, setupActiveSpeaker],
  );

  // Wire a freshly received consumer track into the source slot for its owner
  // and refresh their tile.
  const attachConsumerTrack = useCallback(
    (
      socketId: string,
      producerId: string,
      consumerId: string,
      source: SfuProducerSource,
      track: MediaStreamTrack,
      participant: SfuParticipant,
    ) => {
      remoteTracksRef.current[socketId] = {
        ...remoteTracksRef.current[socketId],
        [source]: track,
      };
      producerInfoRef.current[producerId] = {
        consumerId,
        socketId,
        source,
        track,
      };
      if (!peersRef.current[socketId]) {
        peersRef.current[socketId] = { stream: null, participant };
      }
      recomposePeerStream(socketId);
    },
    [recomposePeerStream],
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
          rtpParameters: RtpParameters;
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
          participantsRef.current.find(
            (p) => p.socketId === producerSocketId,
          ) ??
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
          params.source,
          consumer.track,
          participant,
        );
      } catch (err) {
        console.error("[sfu] consume failed", err);
        // Allow a later retry of this producer if consuming failed.
        consumingProducerIdsRef.current.delete(producerId);
      }
    },
    [attachConsumerTrack],
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

  // Close one of our producers locally AND on the server (the server-side
  // close is what fires producer-closed on everyone else's consumers).
  const closeProducer = useCallback((source: SfuProducerSource) => {
    const producer = producersRef.current[source];
    if (producer) {
      try {
        producer.close();
      } catch {
        // ignore
      }
      producersRef.current[source] = null;
    }
    socketRef.current?.emit("sfu:close-producer", { source }, () => {});
  }, []);

  const updateLocalAudioState = useCallback((muted: boolean) => {
    setIsMuted(muted);
    isMutedRef.current = muted;
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !muted;
  }, []);

  // The local tile shows the screen track while sharing, otherwise the camera
  // track from localStreamRef (the source of truth for camera/mic). Kept as a
  // separate MediaStream so screen sharing never has to mutate - and risk
  // losing - the camera track held on localStreamRef. (Fixes "self not showing
  // while screen sharing".)
  const refreshDisplayedLocalStream = useCallback(() => {
    const local = localStreamRef.current;
    if (!local) {
      setLocalStream(null);
      return;
    }
    const audio = local.getAudioTracks();
    const screenTrack = isScreenSharingRef.current
      ? screenStreamRef.current?.getVideoTracks()[0]
      : null;
    if (screenTrack) {
      setLocalStream(new MediaStream([screenTrack, ...audio]));
    } else {
      // Camera path: a fresh reference so VideoTile re-binds srcObject.
      setLocalStream(new MediaStream(local.getTracks()));
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    updateLocalAudioState(next);
    socketRef.current?.emit("sfu:toggle-mute", { is_muted: next });
  }, [isMuted, updateLocalAudioState]);

  // Camera on/off. On: acquire a fresh camera track and produce it. Off: stop
  // the track (releases the device + LED) and close the camera producer.
  // Returns the resulting camera-off value (may differ from the request if
  // getUserMedia fails when turning on).
  const updateLocalVideoState = useCallback(
    async (off: boolean): Promise<boolean> => {
      if (videoBusyRef.current) return off;
      videoBusyRef.current = true;
      try {
        const stream = localStreamRef.current;
        if (!stream) {
          setIsVideoOff(off);
          return off;
        }

        if (off) {
          const track = stream.getVideoTracks()[0];
          if (track) {
            track.stop();
            stream.removeTrack(track);
          }
          closeProducer("camera");
          localStreamRef.current = new MediaStream(stream.getTracks());
          // While screen sharing, the local tile shows the screen, so leave
          // isVideoOff/the displayed stream alone - just update the source ref.
          if (!isScreenSharingRef.current) {
            setIsVideoOff(true);
            refreshDisplayedLocalStream();
            syncRecordingSourcesRef.current?.();
          }
          return true;
        }

        // Camera ON - acquire a fresh video track and graft it into the stream.
        let camStream: MediaStream;
        try {
          camStream = await navigator.mediaDevices.getUserMedia({
            video: role === "guest" ? GUEST_VIDEO_CONSTRAINTS : true,
          });
        } catch {
          toast.error("Couldn't access the camera");
          setIsVideoOff(true);
          return true;
        }
        const newTrack = camStream.getVideoTracks()[0];
        if (!newTrack) {
          camStream.getTracks().forEach((t) => t.stop());
          setIsVideoOff(true);
          return true;
        }

        const current = localStreamRef.current ?? stream;
        // Drop any stale video track before adding the new one.
        current.getVideoTracks().forEach((t) => {
          t.stop();
          current.removeTrack(t);
        });
        current.addTrack(newTrack);
        localStreamRef.current = new MediaStream(current.getTracks());

        try {
          await produceTrack(newTrack, "camera");
        } catch (err) {
          // Producing failed (dead transport / signalling timeout): release the
          // camera again so the LED doesn't stay on for a track nobody gets.
          console.error("[sfu] camera produce failed", err);
          newTrack.stop();
          current.removeTrack(newTrack);
          localStreamRef.current = new MediaStream(current.getTracks());
          toast.error("Couldn't publish the camera");
          setIsVideoOff(true);
          return true;
        }

        if (!isScreenSharingRef.current) {
          setIsVideoOff(false);
          refreshDisplayedLocalStream();
          syncRecordingSourcesRef.current?.();
        }
        return false;
      } finally {
        videoBusyRef.current = false;
      }
    },
    [role, closeProducer, produceTrack, refreshDisplayedLocalStream],
  );

  const toggleVideo = useCallback(async () => {
    if (videoBusyRef.current) return;
    const requested = !isVideoOff;
    const actual = await updateLocalVideoState(requested);
    // Emit the state we actually ended up in (getUserMedia may have failed).
    socketRef.current?.emit("sfu:toggle-video", { is_video_off: actual });
  }, [isVideoOff, updateLocalVideoState]);

  const toggleScreenShare = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket) return;

    if (isScreenSharingRef.current) {
      const stream = screenStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      closeProducer("screen");
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
      // Local preview: back to the camera - or the avatar if it's off. The
      // camera producer (if any) kept running the whole time, so remote tiles
      // switch back on their own via recompose.
      const cam = localStreamRef.current?.getVideoTracks()[0] ?? null;
      setIsVideoOff(!cam);
      refreshDisplayedLocalStream();
      // The recording follows the active video source; re-point it at the
      // camera (or nothing) now that the screen track has stopped.
      syncRecordingSourcesRef.current?.();
      return;
    }

    let display: MediaStream | null = null;
    try {
      display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = display;
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) {
        display.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        return;
      }
      await produceTrack(screenTrack, "screen");
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      // Local preview: show the screen track and flag video "on" so VideoTile
      // renders the <video>. The camera track (if any) stays untouched on
      // localStreamRef so it can be restored when sharing stops.
      setIsVideoOff(false);
      refreshDisplayedLocalStream();
      // Recording (if running) should now capture the screen, not the camera.
      syncRecordingSourcesRef.current?.();
      screenTrack.onended = () => {
        toggleScreenShare();
      };
    } catch {
      // Either the user dismissed the picker, or producing failed after the
      // capture started - stop the capture so the browser's "sharing" pill
      // doesn't linger for a stream nobody receives.
      if (display) {
        display.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current === display) screenStreamRef.current = null;
      toast.error("Screen share canceled");
    }
  }, [closeProducer, produceTrack, refreshDisplayedLocalStream]);

  // ---------------------------------------------------------------------------
  // Recording (identical approach to the mesh): a canvas compositor draws the
  // currently presented video source (screen while sharing, else camera, else a
  // branded placeholder), MediaRecorder captures canvas + mic, and the file is
  // uploaded to S3 via the tutor presign endpoints when recording stops.
  // ---------------------------------------------------------------------------

  const pickRecordingMime = useCallback((): string => {
    const candidates = [
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const type of candidates) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    }
    return "video/webm";
  }, []);

  // The video track currently being presented: the screen while sharing,
  // otherwise the live camera track (null when the camera is off).
  const getActiveVideoTrack = useCallback((): MediaStreamTrack | null => {
    if (isScreenSharingRef.current) {
      return screenStreamRef.current?.getVideoTracks()[0] ?? null;
    }
    return localStreamRef.current?.getVideoTracks()[0] ?? null;
  }, []);

  // Point the compositor's hidden <video> at the active source track. Switching
  // the track keeps the canvas - and therefore the captured recording track -
  // identical, so MediaRecorder never has to restart.
  const setCompositorSource = useCallback((track: MediaStreamTrack | null) => {
    const id = track?.id ?? null;
    if (compositorTrackIdRef.current === id) return;
    compositorTrackIdRef.current = id;
    const videoEl = compositorVideoRef.current;
    if (!videoEl) return;
    if (track) {
      videoEl.srcObject = new MediaStream([track]);
      videoEl.play().catch(() => undefined);
    } else {
      videoEl.srcObject = null;
    }
  }, []);

  const syncRecordingSources = useCallback(() => {
    if (!recorderRef.current) return;
    setCompositorSource(getActiveVideoTrack());
  }, [getActiveVideoTrack, setCompositorSource]);

  useEffect(() => {
    syncRecordingSourcesRef.current = syncRecordingSources;
  }, [syncRecordingSources]);

  const buildRecordingStream = useCallback((): MediaStream | null => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;

    const canvas =
      canvasRef.current ?? (canvasRef.current = document.createElement("canvas"));
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Canvas unavailable - fall back to recording the raw active track.
      const raw = getActiveVideoTrack();
      const tracks: MediaStreamTrack[] = [];
      if (raw) tracks.push(raw);
      if (audioTrack) tracks.push(audioTrack);
      return tracks.length ? new MediaStream(tracks) : null;
    }

    // Hidden <video> the compositor reads frames from.
    const videoEl =
      compositorVideoRef.current ??
      (compositorVideoRef.current = document.createElement("video"));
    videoEl.muted = true;
    videoEl.playsInline = true;
    compositorTrackIdRef.current = null;
    setCompositorSource(getActiveVideoTrack());

    const draw = () => {
      ctx.fillStyle = "#09090b"; // zinc-950, matches the meeting shell
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const v = compositorVideoRef.current;
      if (v && v.videoWidth > 0 && v.videoHeight > 0) {
        // Contain the source inside 1280x720 without stretching.
        const scale = Math.min(
          canvas.width / v.videoWidth,
          canvas.height / v.videoHeight,
        );
        const w = v.videoWidth * scale;
        const h = v.videoHeight * scale;
        ctx.drawImage(v, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      } else {
        // No live video (camera off, not sharing): keep the dark frame so the
        // recording stays valid and the audio keeps flowing.
        ctx.fillStyle = "#52525b"; // zinc-600
        ctx.font = "600 36px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Navyoga", canvas.width / 2, canvas.height / 2);
      }
      compositorRafRef.current = requestAnimationFrame(draw);
    };
    if (compositorRafRef.current === null) {
      compositorRafRef.current = requestAnimationFrame(draw);
    }

    const canvasStream = canvas.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0] ?? null;

    const tracks: MediaStreamTrack[] = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);
    return tracks.length ? new MediaStream(tracks) : null;
  }, [getActiveVideoTrack, setCompositorSource]);

  // Tear down the compositor (RAF loop, hidden video, captured canvas track).
  const stopCompositor = useCallback(() => {
    if (compositorRafRef.current !== null) {
      cancelAnimationFrame(compositorRafRef.current);
      compositorRafRef.current = null;
    }
    if (compositorVideoRef.current) {
      compositorVideoRef.current.srcObject = null;
    }
    compositorTrackIdRef.current = null;
  }, []);

  const uploadRecording = useCallback(
    async (blob: Blob, mime: string) => {
      const cid = classId;
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const contentType = mime.includes("mp4") ? "video/mp4" : "video/webm";
      const filename = `recording.${ext}`;
      const store = recordingUploadsRef.current;

      // Register the upload up front so the "My Classes" table shows it (at 0%)
      // the instant the class ends, before the presign round-trip resolves.
      store?.startUpload(cid, blob.size);

      try {
        const presign = await requestTutorRecordingPresign(cid, {
          filename,
          contentType,
        });

        // XMLHttpRequest (not fetch) so we get byte-level upload.onprogress -
        // essential for multi-GB recordings where the PUT can take minutes.
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presign.url, true);
          xhr.setRequestHeader("Content-Type", contentType);

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            store?.setProgress(cid, (event.loaded / event.total) * 100);
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              store?.setProgress(cid, 100);
              resolve();
            } else {
              reject(new Error("Recording upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Recording upload failed"));
          xhr.onabort = () => reject(new Error("Recording upload cancelled"));
          xhr.send(blob);
        });

        // Bytes are in S3; now persist the path onto the class.
        store?.setStatus(cid, "saving");
        await saveTutorRecording(cid, presign.storePath);

        store?.setStatus(cid, "done");
        // Clear the row's progress shortly after success so it doesn't linger.
        window.setTimeout(() => store?.clearUpload(cid), 5000);
      } catch (err) {
        store?.setStatus(
          cid,
          "error",
          err instanceof Error ? err.message : "Upload failed",
        );
        throw err;
      }
    },
    [classId],
  );

  const startRecording = useCallback(
    (auto = false) => {
      if (recorderRef.current) return;
      if (typeof MediaRecorder === "undefined") {
        if (!auto) toast.error("Recording is not supported in this browser");
        return;
      }

      const stream = buildRecordingStream();
      if (!stream) {
        if (!auto)
          toast.error("Nothing to record - turn on your camera, screen, or mic");
        return;
      }

      const mime = pickRecordingMime();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: mime });
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          stopCompositor();
          if (!auto) toast.error("Couldn't start recording");
          return;
        }
      }

      recordedChunksRef.current = [];
      recordingMimeRef.current = recorder.mimeType || mime;
      recordingStreamRef.current = stream;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopCompositor();
        const mimeUsed = recordingMimeRef.current;
        const blob = new Blob(recordedChunksRef.current, { type: mimeUsed });
        recordedChunksRef.current = [];
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setIsRecording(false);

        if (blob.size === 0) {
          setIsRecordingBusy(false);
          return;
        }

        setIsRecordingBusy(true);
        toast.message("Uploading recording…");
        uploadRecording(blob, mimeUsed)
          .then(() => toast.success("Recording saved to this class"))
          .catch((err) =>
            toast.error(
              err instanceof Error ? err.message : "Failed to save recording",
            ),
          )
          .finally(() => setIsRecordingBusy(false));
      };

      // Flush a chunk every few seconds so a crash mid-session still yields a
      // partial, playable file rather than losing everything.
      recorder.start(4000);
      recorderRef.current = recorder;
      setIsRecording(true);
      toast(auto ? "Class recording started" : "Recording started", {
        icon: "🔴",
      });
    },
    [buildRecordingStream, pickRecordingMime, stopCompositor, uploadRecording],
  );

  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      // ignore - onstop handles cleanup
    }
  }, []);

  const toggleRecording = useCallback(() => {
    const isHost = !!selfRef.current && selfRef.current.userId === hostUserId;
    if (!isHost) {
      toast.error("Only the yoga shikshak can record this class");
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [hostUserId, isRecording, startRecording, stopRecording]);

  // ---------------------------------------------------------------------------

  const destroyRemote = useCallback(
    (socketId: string) => {
      const stream = remoteStreamsRef.current[socketId];
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        delete remoteStreamsRef.current[socketId];
      }
      delete remoteTracksRef.current[socketId];
      const ctx = audioCtxRef.current[socketId];
      if (ctx) {
        ctx.close().catch(() => undefined);
        delete audioCtxRef.current[socketId];
      }
      // Drop this peer's producer/consumer bookkeeping so their producerIds can
      // be consumed afresh if they rejoin.
      for (const [producerId, info] of Object.entries(
        producerInfoRef.current,
      )) {
        if (info.socketId === socketId) {
          const consumer = consumersRef.current[info.consumerId];
          if (consumer) {
            try {
              consumer.close();
            } catch {
              // ignore
            }
            delete consumersRef.current[info.consumerId];
          }
          consumingProducerIdsRef.current.delete(producerId);
          delete producerInfoRef.current[producerId];
        }
      }
      delete peersRef.current[socketId];
      publishPeers();
    },
    [publishPeers],
  );

  // Drop every remote consumer/stream and our own producers/transports/device,
  // but KEEP local capture (mic/camera/screen tracks) and the socket. Used when
  // the signalling socket reconnects: the server built a fresh participant for
  // our new socket id, so all previous mediasoup state is dead and the session
  // must be rebuilt - while whatever the user had on keeps running locally.
  const resetMediaSession = useCallback(() => {
    for (const socketId of Object.keys(peersRef.current)) {
      destroyRemote(socketId);
    }
    Object.values(consumersRef.current).forEach((c) => {
      try {
        c.close();
      } catch {
        // ignore
      }
    });
    consumersRef.current = {};
    producerInfoRef.current = {};
    consumingProducerIdsRef.current = new Set();
    pendingProducersRef.current = [];
    remoteTracksRef.current = {};
    remoteStreamsRef.current = {};

    Object.values(producersRef.current).forEach((p) => {
      try {
        p?.close();
      } catch {
        // ignore
      }
    });
    producersRef.current = { camera: null, mic: null, screen: null };

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
  }, [destroyRemote]);

  const teardown = useCallback(() => {
    if (teardownStartedRef.current) return;
    teardownStartedRef.current = true;

    // Stop any in-progress recording first, while its source tracks are still
    // live, so MediaRecorder.onstop fires and the (partial) file uploads. The
    // upload runs async after onstop; teardown does not await it.
    if (recorderRef.current) {
      try {
        if (recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      } catch {
        // ignore
      }
    }

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
    producerInfoRef.current = {};
    consumingProducerIdsRef.current = new Set();
    pendingProducersRef.current = [];
    remoteTracksRef.current = {};

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
    setParticipantsSynced([]);
    setSelf(null);
    setHostUserId(null);
    setConnectionState("ended");
  }, [setParticipantsSynced]);

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
    // Re-arm teardown for this mount (StrictMode remounts leave the one-shot
    // guard stuck `true` from the first unmount otherwise) and clear de-dupe
    // state so a fresh session starts clean.
    teardownStartedRef.current = false;
    seenMessageIdsRef.current = new Set();
    producerInfoRef.current = {};
    consumingProducerIdsRef.current = new Set();
    pendingProducersRef.current = [];
    remoteTracksRef.current = {};

    // Whether this socket has completed its FIRST connect; any 'connect' after
    // that is a reconnect and triggers a full rejoin (the server forgot us the
    // moment the old socket dropped).
    let hasConnectedOnce = false;
    let joining = false;

    // Join (or re-join) the room on the current socket: signalling handshake,
    // transports, then produce whatever local tracks are live and consume
    // everything already in the room.
    const joinSession = async (isRejoin: boolean) => {
      const socket = socketRef.current;
      if (!socket || cancelled) return;
      joining = true;
      try {
        const joinRes = await emitWithAck<{
          self: SfuParticipant;
          participants: SfuParticipant[];
          hostUserId: string | null;
          rtpCapabilities: RtpCapabilities;
        }>(socket, "sfu:join-room", { classId, name: displayName });
        if (cancelled) return;

        setSelf(joinRes.self);
        setParticipantsSynced(joinRes.participants);
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

        // After a rejoin the server re-created us with the default state
        // (muted, camera off) - re-publish any live local video and re-sync
        // the flags so the rest of the room sees the truth.
        if (isRejoin) {
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack && device.canProduce("video")) {
            await produceTrack(camTrack, "camera");
            socket.emit("sfu:toggle-video", { is_video_off: false });
          }
          const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
          if (screenTrack && device.canProduce("video")) {
            await produceTrack(screenTrack, "screen");
          }
          if (!isMutedRef.current) {
            socket.emit("sfu:toggle-mute", { is_muted: false });
          }
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

        // Auto-start recording from the tutor's end the moment the host joins
        // (exactly like the mesh). Survives reconnects: the recorder keeps
        // running on local tracks, so we only start it if it isn't already.
        const isHost =
          !!joinRes.self && joinRes.self.userId === joinRes.hostUserId;
        if (isHost && !recorderRef.current) {
          startRecordingRef.current?.(true);
        }
      } finally {
        joining = false;
      }
    };

    const bootstrap = async () => {
      // Acquire mic (kept, muted) + camera (stopped, off) up front - same
      // default-off behaviour as the mesh path.
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: role === "guest" ? GUEST_VIDEO_CONSTRAINTS : true,
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
      isMutedRef.current = true;
      // Stop AND remove the camera track: releases the device (LED off), and -
      // unlike the mesh - the SFU needs no placeholder track since producers
      // are created on demand when the camera turns on.
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        stream.removeTrack(videoTrack);
      }
      setIsVideoOff(true);

      localStreamRef.current = new MediaStream(stream.getTracks());
      setLocalStream(new MediaStream(stream.getTracks()));
      setupActiveSpeaker("local", localStreamRef.current);

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

      // Reconnect handling: socket.io re-establishes the connection by itself,
      // but the server treated the drop as a leave and destroyed our mediasoup
      // state - so on every connect after the first, rebuild the session.
      socket.on("connect", () => {
        if (!hasConnectedOnce) {
          hasConnectedOnce = true;
          return;
        }
        if (cancelled || teardownStartedRef.current || joining) return;
        toast.message("Reconnected - rejoining the class…");
        setConnectionState("connecting");
        resetMediaSession();
        joinSession(true).catch((err) => {
          console.error("[sfu] rejoin failed", err);
          if (cancelled || teardownStartedRef.current) return;
          toast.error("Couldn't rejoin the class");
          teardown();
          onLeaveRef.current();
        });
      });

      socket.on("disconnect", () => {
        if (cancelled || teardownStartedRef.current) return;
        toast.message("Connection lost - reconnecting…");
      });

      // Server events -------------------------------------------------------
      socket.on("sfu:user-connected", ({ participant }) => {
        setParticipantsSynced((prev) =>
          prev.some((p) => p.socketId === participant.socketId)
            ? prev
            : [...prev, participant],
        );
      });

      socket.on("sfu:user-disconnected", ({ socketId }) => {
        destroyRemote(socketId);
        setParticipantsSynced((prev) =>
          prev.filter((p) => p.socketId !== socketId),
        );
      });

      socket.on("sfu:participant-update", ({ participants: list }) => {
        setParticipantsSynced(list);
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
          // If the recv transport isn't up yet (event arrived mid-bootstrap or
          // mid-rejoin), queue it; the join flow drains the queue once
          // transports exist.
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

      socket.on("sfu:producer-closed", ({ producerId }) => {
        // Tear down EXACTLY the track this producer produced (matched by
        // producerId), never "any track of this kind" - otherwise a
        // camera/screen restart, whose new track has already been attached,
        // could be wiped by a late close event for the OLD producer.
        const info = producerInfoRef.current[producerId];
        consumingProducerIdsRef.current.delete(producerId);
        delete producerInfoRef.current[producerId];
        if (!info) return;

        const consumer = consumersRef.current[info.consumerId];
        if (consumer) {
          try {
            consumer.close();
          } catch {
            // ignore
          }
          delete consumersRef.current[info.consumerId];
        }

        const bucket = remoteTracksRef.current[info.socketId];
        // Only clear the slot if it still holds this producer's track (a
        // restart may already have swapped in a newer one).
        if (bucket && bucket[info.source] === info.track) {
          delete bucket[info.source];
          try {
            info.track.stop();
          } catch {
            // ignore
          }
          // Recompose: if a screen share just ended this puts the (still
          // consumed) camera track back on the tile.
          recomposePeerStream(info.socketId);
        }
      });

      socket.on("sfu:participant-muted-status", ({ userId, isMuted: m }) => {
        setParticipantsSynced((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isMuted: m } : p)),
        );
      });
      socket.on("sfu:participant-video-status", ({ userId, isVideoOff: v }) => {
        setParticipantsSynced((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isVideoOff: v } : p)),
        );
      });
      socket.on("sfu:screen-share-status", ({ userId, isSharing }) => {
        setParticipantsSynced((prev) =>
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

      // Initial join.
      try {
        await joinSession(false);
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
      isRecording,
      isRecordingBusy,
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
      isRecording,
      isRecordingBusy,
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
      <MeetingContext.Provider value={value as unknown as MeetingContextValue}>
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

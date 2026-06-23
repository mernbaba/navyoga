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
import Peer from "simple-peer";
import { toast } from "sonner";
import { registerAudioContext } from "@/lib/audioUnlock";
import {
  requestTutorRecordingPresign,
  saveTutorRecording,
} from "@/api/live";
import {
  connectMeetingSocket,
  type MeetingChatMessage,
  type MeetingClientSocket,
  type MeetingParticipant,
  type MeetingRoleClient,
} from "@/lib/meetingSocket";

type RemotePeer = {
  peer: Peer.Instance;
  stream: MediaStream | null;
  participant: MeetingParticipant;
};

export type ActivePanel = "participants" | "chat" | null;

export type MeetingContextValue = {
  classId: string;
  role: MeetingRoleClient;
  self: MeetingParticipant | null;
  participants: MeetingParticipant[];
  hostUserId: string | null;
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isRecordingBusy: boolean;
  peers: Record<string, RemotePeer>;
  chatMessages: MeetingChatMessage[];
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

const MeetingContext = createContext<MeetingContextValue | null>(null);

type ProviderProps = {
  classId: string;
  role: MeetingRoleClient;
  displayName: string;
  onLeave: () => void;
  children: ReactNode;
};

export const MeetingProvider = ({
  classId,
  role,
  displayName,
  onLeave,
  children,
}: ProviderProps) => {
  const [self, setSelf] = useState<MeetingParticipant | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingBusy, setIsRecordingBusy] = useState(false);
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({});
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [activePanel, setActivePanelState] = useState<ActivePanel>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "joined" | "ended"
  >("connecting");

  const socketRef = useRef<MeetingClientSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RemotePeer>>({});
  const audioCtxRef = useRef<Record<string, AudioContext>>({});
  const teardownStartedRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const videoBusyRef = useRef(false);
  const onLeaveRef = useRef(onLeave);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingMimeRef = useRef<string>("video/webm");
  const activePanelRef = useRef<ActivePanel>(null);
  const selfRef = useRef<MeetingParticipant | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  useEffect(() => {
    selfRef.current = self;
  }, [self]);

  const setActivePanel = useCallback((panel: ActivePanel) => {
    if (panel === "chat") setUnreadChat(0);
    setActivePanelState(panel);
  }, []);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  const setupActiveSpeaker = useCallback((id: string, stream: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      // Mobile starts AudioContexts suspended until a user gesture; register so
      // it resumes on first interaction (otherwise the analyser never ticks).
      registerAudioContext(ctx);
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current[id] = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!audioCtxRef.current[id]) return;
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

  const updateLocalAudioState = useCallback((muted: boolean) => {
    setIsMuted(muted);
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !muted;
  }, []);

  const replaceVideoTrackOnPeers = useCallback(
    (track: MediaStreamTrack | null) => {
      Object.values(peersRef.current).forEach((entry) => {
        try {
          const pc = (entry.peer as unknown as { _pc?: RTCPeerConnection })._pc;
          const sender = pc
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          sender?.replaceTrack(track);
        } catch {
          // ignore
        }
      });
    },
    [],
  );

  // Turning the camera OFF must release the device (track.stop()), not just
  // disable it - otherwise the OS keeps the camera "in use" and the LED stays
  // on. Turning it back ON re-acquires a fresh track via getUserMedia.
  // Returns the resulting isVideoOff value (may differ from `off` if
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
          // Don't yank the camera track out of peers while screen sharing -
          // the video sender is carrying the screen track in that case.
          if (!isScreenSharingRef.current) {
            replaceVideoTrackOnPeers(null);
          }
          setIsVideoOff(true);
          // New MediaStream reference so consumers (VideoTile) re-render and
          // drop the now-stopped track from the <video> element.
          const next = new MediaStream(stream.getTracks());
          localStreamRef.current = next;
          setLocalStream(next);
          return true;
        }

        // Camera ON - acquire a fresh video track and graft it into the stream.
        let camStream: MediaStream;
        try {
          camStream = await navigator.mediaDevices.getUserMedia({ video: true });
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

        if (!isScreenSharingRef.current) {
          replaceVideoTrackOnPeers(newTrack);
        }
        setIsVideoOff(false);
        const next = new MediaStream(current.getTracks());
        localStreamRef.current = next;
        setLocalStream(next);
        return false;
      } finally {
        videoBusyRef.current = false;
      }
    },
    [replaceVideoTrackOnPeers],
  );

  const destroyPeer = useCallback((socketId: string) => {
    const existing = peersRef.current[socketId];
    if (existing) {
      try {
        existing.peer.destroy();
      } catch {
        // ignore
      }
      delete peersRef.current[socketId];
      const ctx = audioCtxRef.current[socketId];
      if (ctx) {
        ctx.close().catch(() => undefined);
        delete audioCtxRef.current[socketId];
      }
      setPeers({ ...peersRef.current });
    }
  }, []);

  const createOutgoingPeer = useCallback(
    (
      targetSocketId: string,
      stream: MediaStream,
      participant: MeetingParticipant,
    ) => {
      const peer = new Peer({ initiator: true, trickle: true, stream });

      peer.on("signal", (signal) => {
        const sock = socketRef.current;
        if (!sock) return;
        const sig = signal as { type?: string; candidate?: unknown };
        if (sig.type === "offer") {
          sock.emit("offer", { target_sid: targetSocketId, sdp: signal });
        } else if (sig.candidate) {
          sock.emit("ice-candidate", {
            target_sid: targetSocketId,
            candidate: signal,
          });
        }
      });

      peer.on("stream", (remote) => {
        setupActiveSpeaker(targetSocketId, remote);
        const entry = peersRef.current[targetSocketId];
        if (entry) {
          entry.stream = remote;
          setPeers({ ...peersRef.current });
        }
      });

      peer.on("error", () => destroyPeer(targetSocketId));
      peer.on("close", () => destroyPeer(targetSocketId));

      peersRef.current[targetSocketId] = {
        peer,
        stream: null,
        participant,
      };
      setPeers({ ...peersRef.current });
    },
    [destroyPeer, setupActiveSpeaker],
  );

  const createIncomingPeer = useCallback(
    (
      callerSocketId: string,
      offer: unknown,
      stream: MediaStream,
      participant: MeetingParticipant,
    ) => {
      const peer = new Peer({ initiator: false, trickle: true, stream });

      peer.on("signal", (signal) => {
        const sock = socketRef.current;
        if (!sock) return;
        const sig = signal as { type?: string; candidate?: unknown };
        if (sig.type === "answer") {
          sock.emit("answer", { target_sid: callerSocketId, sdp: signal });
        } else if (sig.candidate) {
          sock.emit("ice-candidate", {
            target_sid: callerSocketId,
            candidate: signal,
          });
        }
      });

      peer.on("stream", (remote) => {
        setupActiveSpeaker(callerSocketId, remote);
        const entry = peersRef.current[callerSocketId];
        if (entry) {
          entry.stream = remote;
          setPeers({ ...peersRef.current });
        }
      });

      peer.on("error", () => destroyPeer(callerSocketId));
      peer.on("close", () => destroyPeer(callerSocketId));

      peer.signal(offer as Peer.SignalData);

      peersRef.current[callerSocketId] = {
        peer,
        stream: null,
        participant,
      };
      setPeers({ ...peersRef.current });
    },
    [destroyPeer, setupActiveSpeaker],
  );

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
        socketRef.current.emit("leave-room");
        socketRef.current.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }

    Object.keys(peersRef.current).forEach((sid) => {
      try {
        peersRef.current[sid]?.peer.destroy();
      } catch {
        // ignore
      }
    });
    peersRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    Object.values(audioCtxRef.current).forEach((ctx) => {
      ctx.close().catch(() => undefined);
    });
    audioCtxRef.current = {};

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
    socketRef.current?.emit("end-meeting");
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    updateLocalAudioState(next);
    socketRef.current?.emit("toggle-mute", { is_muted: next });
  }, [isMuted, updateLocalAudioState]);

  const toggleVideo = useCallback(async () => {
    if (videoBusyRef.current) return;
    const requested = !isVideoOff;
    const actual = await updateLocalVideoState(requested);
    // Emit the state we actually ended up in (getUserMedia may have failed).
    socketRef.current?.emit("toggle-video", { is_video_off: actual });
  }, [isVideoOff, updateLocalVideoState]);

  const toggleScreenShare = useCallback(async () => {
    const sock = socketRef.current;
    if (!sock) return;

    if (isScreenSharing) {
      const stream = screenStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      // Restore the camera track to peers - or null it out if the camera is
      // currently off (no live video track), so peers stop seeing the screen.
      const cam = localStreamRef.current?.getVideoTracks()[0] ?? null;
      replaceVideoTrackOnPeers(cam);
      sock.emit("screen-share-stop");
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
      replaceVideoTrackOnPeers(screenTrack);
      setIsScreenSharing(true);
      sock.emit("screen-share-start");
      screenTrack.onended = () => {
        toggleScreenShare();
      };
    } catch {
      toast.error("Screen share canceled");
    }
  }, [isScreenSharing, replaceVideoTrackOnPeers]);

  // Pick a container/codec the browser can actually produce. Order matters:
  // mp4 first (broadest playback), then webm variants.
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

  // Build the stream MediaRecorder captures: the currently active video track
  // (camera or, while sharing, the screen) plus the tutor's mic - regardless of
  // its muted state, so the recording mirrors what the tutor is presenting.
  const buildRecordingStream = useCallback((): MediaStream | null => {
    const videoTrack =
      (isScreenSharingRef.current
        ? screenStreamRef.current?.getVideoTracks()[0]
        : null) ?? localStreamRef.current?.getVideoTracks()[0] ?? null;
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;

    if (!videoTrack && !audioTrack) return null;

    const tracks: MediaStreamTrack[] = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);
    return new MediaStream(tracks);
  }, []);

  const uploadRecording = useCallback(
    async (blob: Blob, mime: string) => {
      const cid = classId;
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const contentType = mime.includes("mp4") ? "video/mp4" : "video/webm";
      const filename = `recording.${ext}`;

      const presign = await requestTutorRecordingPresign(cid, {
        filename,
        contentType,
      });

      const putRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!putRes.ok) throw new Error("Recording upload failed");

      await saveTutorRecording(cid, presign.storePath);
    },
    [classId],
  );

  const startRecording = useCallback(() => {
    if (recorderRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      toast.error("Recording is not supported in this browser");
      return;
    }

    const stream = buildRecordingStream();
    if (!stream) {
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
        toast.error("Couldn't start recording");
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
    toast("Recording started", { icon: "🔴" });
  }, [buildRecordingStream, pickRecordingMime, uploadRecording]);

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
    const isHost =
      !!selfRef.current && selfRef.current.userId === hostUserId;
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

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    socketRef.current?.emit("send-message", { message: trimmed });
  }, []);

  const hostMuteParticipant = useCallback((userId: string) => {
    socketRef.current?.emit("mute-participant", { user_id: userId });
  }, []);

  const hostRemoveParticipant = useCallback((userId: string) => {
    socketRef.current?.emit("remove-participant", { user_id: userId });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Re-arm teardown for this mount. teardownStartedRef is a one-shot guard;
    // without resetting it here, a remount (e.g. React StrictMode in dev, which
    // mounts → unmounts → remounts) would leave it stuck `true` from the first
    // unmount, turning the next teardown into a permanent no-op and leaking the
    // socket/streams. Also clear de-dupe state so a fresh session starts clean.
    teardownStartedRef.current = false;
    seenMessageIdsRef.current = new Set();

    const bootstrap = async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsVideoOff(true);
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

      // Start with mic and camera OFF by default. The mic is kept but muted
      // via track.enabled = false. For the camera we stop() the video track to
      // release the device (OS shows the camera as free, LED off), but keep the
      // (now-ended) track on the stream so that when peers are created a video
      // transceiver/sender still exists - that lets replaceTrack swap in a live
      // camera track later, when the user turns the camera on.
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = false;
      setIsMuted(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.stop();
      setIsVideoOff(true);

      localStreamRef.current = stream;
      setLocalStream(stream);
      setupActiveSpeaker("local", stream);

      let socket: MeetingClientSocket;
      try {
        socket = connectMeetingSocket(role);
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

      socket.on("error", (payload) => {
        toast.error(payload.message);
      });

      socket.on("room-joined", (data) => {
        setSelf(data.self);
        setParticipants(data.participants);
        setHostUserId(data.hostUserId);
        setConnectionState("joined");
        const currentStream = localStreamRef.current;
        if (currentStream) {
          data.participants.forEach((p) => {
            createOutgoingPeer(p.socketId, currentStream, p);
          });
        }
      });

      socket.on("user-connected", () => {
        // peer will send us an offer; we handle it in 'offer'
      });

      socket.on("offer", ({ sender_sid, sdp }) => {
        const currentStream = localStreamRef.current;
        if (!currentStream) return;
        const participant =
          peersRef.current[sender_sid]?.participant ?? {
            userId: sender_sid,
            socketId: sender_sid,
            name: "Participant",
            role: "guest" as MeetingRoleClient,
            isMuted: false,
            isVideoOff: false,
            isScreenSharing: false,
            joinedAt: Date.now(),
          };
        createIncomingPeer(sender_sid, sdp, currentStream, participant);
      });

      socket.on("answer", ({ sender_sid, sdp }) => {
        const entry = peersRef.current[sender_sid];
        try {
          entry?.peer.signal(sdp as Peer.SignalData);
        } catch {
          // ignore late signal
        }
      });

      socket.on("ice-candidate", ({ sender_sid, candidate }) => {
        const entry = peersRef.current[sender_sid];
        try {
          entry?.peer.signal(candidate as Peer.SignalData);
        } catch {
          // ignore
        }
      });

      socket.on("user-disconnected", ({ socketId }) => {
        destroyPeer(socketId);
      });

      socket.on("participant-update", ({ participants: list }) => {
        setParticipants(list);
        list.forEach((p) => {
          const entry = peersRef.current[p.socketId];
          if (entry) entry.participant = p;
        });
      });

      socket.on("participant-muted-status", ({ userId, isMuted: m }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isMuted: m } : p)),
        );
      });

      socket.on("participant-video-status", ({ userId, isVideoOff: v }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isVideoOff: v } : p)),
        );
      });

      socket.on("screen-share-status", ({ userId, isSharing }) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, isScreenSharing: isSharing } : p,
          ),
        );
      });

      socket.on("message-received", (msg) => {
        // De-dupe by id via a ref-backed Set. The same message can be
        // delivered more than once (e.g. a duplicate socket created during a
        // dev StrictMode remount), so we must guard the unread-badge increment
        // against double counting. A ref is used (not the chatMessages array)
        // because it is immune to StrictMode's double-invoked state updaters.
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

      socket.on("mute-request", () => {
        toast.message("The host muted your microphone");
        updateLocalAudioState(true);
        socketRef.current?.emit("toggle-mute", { is_muted: true });
      });

      socket.on("removed-from-meeting", (data) => {
        toast.error(data.message);
        teardown();
        onLeaveRef.current();
      });

      socket.on("meeting-ended", (data) => {
        toast.message(data.message);
        teardown();
        onLeaveRef.current();
      });

      socket.emit("join-room", { classId, name: displayName });
    };

    bootstrap();

    return () => {
      cancelled = true;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, role, displayName]);

  const value = useMemo<MeetingContextValue>(
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
    ],
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
};

export const useMeeting = (): MeetingContextValue => {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error("useMeeting must be used within MeetingProvider");
  return ctx;
};

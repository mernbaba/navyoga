import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Tracks recording-upload progress per class so it can be shown anywhere in the
// app (e.g. the tutor's "My Classes" table) even after the tutor navigates away
// from the live-session page where the upload is actually running.
//
// This is client-only, single-session state: the upload runs as a presigned PUT
// straight from the tutor's browser to S3, so the percentage is only knowable
// here. Closing the tab loses it (the upload aborts too). Nothing is persisted.

export type RecordingUploadStatus = "uploading" | "saving" | "done" | "error";

export type RecordingUpload = {
  classId: string;
  // 0-100, byte progress of the S3 PUT. Stays at 100 while we PATCH the class.
  progress: number;
  status: RecordingUploadStatus;
  // Total bytes being uploaded, for showing a human size next to the percent.
  totalBytes: number;
  error?: string;
};

type RecordingUploadContextValue = {
  uploads: Record<string, RecordingUpload>;
  getUpload: (classId: string) => RecordingUpload | undefined;
  startUpload: (classId: string, totalBytes: number) => void;
  setProgress: (classId: string, progress: number) => void;
  setStatus: (
    classId: string,
    status: RecordingUploadStatus,
    error?: string,
  ) => void;
  clearUpload: (classId: string) => void;
};

const RecordingUploadContext =
  createContext<RecordingUploadContextValue | null>(null);

export const RecordingUploadProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [uploads, setUploads] = useState<Record<string, RecordingUpload>>({});

  const startUpload = useCallback((classId: string, totalBytes: number) => {
    setUploads((prev) => ({
      ...prev,
      [classId]: { classId, progress: 0, status: "uploading", totalBytes },
    }));
  }, []);

  const setProgress = useCallback((classId: string, progress: number) => {
    setUploads((prev) => {
      const current = prev[classId];
      if (!current) return prev;
      const clamped = Math.max(0, Math.min(100, Math.round(progress)));
      if (current.progress === clamped) return prev;
      return { ...prev, [classId]: { ...current, progress: clamped } };
    });
  }, []);

  const setStatus = useCallback(
    (classId: string, status: RecordingUploadStatus, error?: string) => {
      setUploads((prev) => {
        const current = prev[classId];
        if (!current) return prev;
        return { ...prev, [classId]: { ...current, status, error } };
      });
    },
    [],
  );

  const clearUpload = useCallback((classId: string) => {
    setUploads((prev) => {
      if (!prev[classId]) return prev;
      const next = { ...prev };
      delete next[classId];
      return next;
    });
  }, []);

  const getUpload = useCallback(
    (classId: string) => uploads[classId],
    [uploads],
  );

  const value = useMemo(
    () => ({
      uploads,
      getUpload,
      startUpload,
      setProgress,
      setStatus,
      clearUpload,
    }),
    [uploads, getUpload, startUpload, setProgress, setStatus, clearUpload],
  );

  return (
    <RecordingUploadContext.Provider value={value}>
      {children}
    </RecordingUploadContext.Provider>
  );
};

export const useRecordingUploads = (): RecordingUploadContextValue => {
  const ctx = useContext(RecordingUploadContext);
  if (!ctx) {
    throw new Error(
      "useRecordingUploads must be used within a RecordingUploadProvider",
    );
  }
  return ctx;
};

// Safe variant for components that may render outside the provider (returns
// undefined rather than throwing). MeetingContext uses this so the meeting UI
// still works if ever mounted standalone.
export const useRecordingUploadsOptional =
  (): RecordingUploadContextValue | null => useContext(RecordingUploadContext);

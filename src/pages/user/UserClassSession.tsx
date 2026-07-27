import { useEffect } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { SfuMeetingRoom } from "@/components/meeting/SfuMeetingRoom";
import { useRoleSession } from "@/lib/session";
import { markMyClassAttendance } from "@/api/attendance";

export function UserClassSession() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [params] = useSearchParams();
  // ?mode=sfu selects the new mediasoup SFU path; anything else = mesh (default).
  const useSfu = params.get("mode") === "sfu";
  const { user } = useRoleSession("STUDENT");

  // Opening the session marks the student present for this class. Idempotent
  // server-side, and non-fatal — a failure must never block joining.
  useEffect(() => {
    if (!classId) return;
    markMyClassAttendance(classId).catch(() => {});
  }, [classId]);

  if (!classId) {
    return <Navigate to="/user/classes" replace />;
  }

  const displayName =
    (user && "name" in user && typeof user.name === "string" ? user.name : null) ??
    "Student";

  const Room = useSfu ? SfuMeetingRoom : MeetingRoom;

  return (
    <Room
      classId={classId}
      role="guest"
      displayName={displayName}
      onLeave={() => navigate("/user/classes")}
    />
  );
}

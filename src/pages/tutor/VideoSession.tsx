import { Navigate, useNavigate, useSearchParams } from "react-router";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { SfuMeetingRoom } from "@/components/meeting/SfuMeetingRoom";
import { useRoleSession } from "@/lib/session";

export function VideoSession() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classId = params.get("classId");
  // ?mode=sfu selects the new mediasoup SFU path; anything else = mesh (default).
  const useSfu = params.get("mode") === "sfu";
  const { user } = useRoleSession("TUTOR");

  if (!classId) {
    return <Navigate to="/tutor/classes" replace />;
  }

  const displayName =
    (user && "name" in user && typeof user.name === "string" ? user.name : null) ??
    "Yoga Shikshak";

  const Room = useSfu ? SfuMeetingRoom : MeetingRoom;

  return (
    <Room
      classId={classId}
      role="host"
      displayName={displayName}
      onLeave={() => navigate("/tutor/classes")}
    />
  );
}

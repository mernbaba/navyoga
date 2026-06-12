import { Navigate, useNavigate, useSearchParams } from "react-router";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { useRoleSession } from "@/lib/session";

export function VideoSession() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classId = params.get("classId");
  const { user } = useRoleSession("TUTOR");

  if (!classId) {
    return <Navigate to="/tutor/classes" replace />;
  }

  const displayName =
    (user && "name" in user && typeof user.name === "string" ? user.name : null) ??
    "Yoga Shikshak";

  return (
    <MeetingRoom
      classId={classId}
      role="host"
      displayName={displayName}
      onLeave={() => navigate("/tutor/classes")}
    />
  );
}

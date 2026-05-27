import { Navigate, useNavigate, useParams } from "react-router";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { useRoleSession } from "@/lib/session";

export function UserClassSession() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { user } = useRoleSession("STUDENT");

  if (!classId) {
    return <Navigate to="/user/classes" replace />;
  }

  const displayName =
    (user && "name" in user && typeof user.name === "string" ? user.name : null) ??
    "Student";

  return (
    <MeetingRoom
      classId={classId}
      role="guest"
      displayName={displayName}
      onLeave={() => navigate("/user/classes")}
    />
  );
}

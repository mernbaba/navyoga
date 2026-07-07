import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { SfuMeetingRoom } from "@/components/meeting/SfuMeetingRoom";
import { useRoleSession } from "@/lib/session";

export function UserClassSession() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [params] = useSearchParams();
  // ?mode=sfu selects the new mediasoup SFU path; anything else = mesh (default).
  const useSfu = params.get("mode") === "sfu";
  const { user } = useRoleSession("STUDENT");

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

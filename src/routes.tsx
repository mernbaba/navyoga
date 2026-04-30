import { createBrowserRouter, Navigate } from "react-router";
import { isRoleAuthenticated, ROLE_LOGIN_PATHS } from "./lib/auth";
import type { LoginRole } from "./components/auth/RoleLoginPage";
import { AdminLayout } from "./components/AdminLayout";
import { TutorLayout } from "./components/TutorLayout";
import { FrontlineLayout } from "./components/FrontlineLayout";
import { OperationsLayout } from "./components/OperationsLayout";
import { UserLayout } from "./components/UserLayout";
import { Dashboard } from "./pages/superadmin/Dashboard";
import { Leads } from "./pages/superadmin/Leads";
import { Students } from "./pages/superadmin/Students";
import { Employees } from "./pages/superadmin/Employees";
import { Tutors } from "./pages/superadmin/Tutors";
import { Classes } from "./pages/superadmin/Classes";
import { Attendance } from "./pages/superadmin/Attendance";
import { Financials } from "./pages/superadmin/Financials";
import { Settings } from "./pages/superadmin/Settings";
import { UserLogin } from "./pages/auth/UserLogin";
import { SuperAdminLogin } from "./pages/auth/SuperAdminLogin";
import { TutorLogin } from "./pages/auth/TutorLogin";
import { OperationsLogin } from "./pages/auth/OperationsLogin";
import { FrontlineLogin } from "./pages/auth/FrontlineLogin";
import { TutorDashboard } from "./pages/tutor/TutorDashboard";
import { TutorClasses } from "./pages/tutor/TutorClasses";
import { TutorStudents } from "./pages/tutor/TutorStudents";
import { TutorSettings } from "./pages/tutor/TutorSettings";
import { VideoSession } from "./pages/tutor/VideoSession";
import { FrontlineDashboard } from "./pages/frontline/FrontlineDashboard";
import { FrontlineLeads } from "./pages/frontline/FrontlineLeads";
import { FrontlineCallLog } from "./pages/frontline/FrontlineCallLog";
import { FrontlineTasks } from "./pages/frontline/FrontlineTasks";
import { FrontlineSettings } from "./pages/frontline/FrontlineSettings";
import { OperationsDashboard } from "./pages/operations/OperationsDashboard";
import { OperationsEmployees } from "./pages/operations/OperationsEmployees";
import { OperationsTutors } from "./pages/operations/OperationsTutors";
import { OperationsFrontlineTeam } from "./pages/operations/OperationsFrontlineTeam";
import { OperationsNotifications } from "./pages/operations/OperationsNotifications";
import { OperationsCoupons } from "./pages/operations/OperationsCoupons";
import { OperationsLeads } from "./pages/operations/OperationsLeads";
import { OperationsUsers } from "./pages/operations/OperationsUsers";
import { OperationsClasses } from "./pages/operations/OperationsClasses";
import { OperationsRecordedClasses } from "./pages/operations/OperationsRecordedClasses";
import { OperationsEvents } from "./pages/operations/OperationsEvents";
import { OperationsSettings } from "./pages/operations/OperationsSettings";
import { UserDashboard } from "./pages/user/UserDashboard";
import { UserClasses } from "./pages/user/UserClasses";
import { UserRecordings } from "./pages/user/UserRecordings";
import { UserAttendance } from "./pages/user/UserAttendance";
import { UserProfile } from "./pages/user/UserProfile";
import { UserPayments } from "./pages/user/UserPayments";
import { UserSettings } from "./pages/user/UserSettings";
import { UserClassSession } from "./pages/user/UserClassSession";
import { UserRecordingPlayer } from "./pages/user/UserRecordingPlayer";
import { UserSelfPaced } from "./pages/user/UserSelfPaced";
import { UserSelfPacedCourse } from "./pages/user/UserSelfPacedCourse";
import { UserReferrals } from "./pages/user/UserReferrals";
import { UserEvents } from "./pages/user/UserEvents";

const ProtectedRoute = ({ role, children }: { role: LoginRole; children: React.ReactNode }) => {
  if (!isRoleAuthenticated(role)) {
    return <Navigate to={ROLE_LOGIN_PATHS[role]} replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <UserLogin />,
  },
  {
    path: "/login-minimal",
    element: <UserLogin />,
  },
  {
    path: "/login/superadmin",
    element: <SuperAdminLogin />,
  },
  {
    path: "/login/tutor",
    element: <TutorLogin />,
  },
  {
    path: "/login/operations",
    element: <OperationsLogin />,
  },
  {
    path: "/login/frontline",
    element: <FrontlineLogin />,
  },
  {
    path: "/",
    element: <Navigate to="/superadmin" replace />,
  },
  {
    path: "/superadmin",
    element: (
      <ProtectedRoute role="SUPERADMIN">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/superadmin/dashboard" replace /> },
      { path: "dashboard", Component: Dashboard },
      { path: "leads", Component: Leads },
      { path: "students", Component: Students },
      { path: "employees", Component: Employees },
      { path: "tutors", Component: Tutors },
      { path: "classes", Component: Classes },
      { path: "attendance", Component: Attendance },
      { path: "financials", Component: Financials },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/tutor",
    element: (
      <ProtectedRoute role="TUTOR">
        <TutorLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/tutor/dashboard" replace /> },
      { path: "dashboard", Component: TutorDashboard },
      { path: "classes", Component: TutorClasses },
      { path: "students", Component: TutorStudents },
      { path: "settings", Component: TutorSettings },
      { path: "video-session", Component: VideoSession },
    ],
  },
  {
    path: "/frontline",
    element: (
      <ProtectedRoute role="FRONTLINE">
        <FrontlineLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/frontline/dashboard" replace /> },
      { path: "dashboard", Component: FrontlineDashboard },
      { path: "leads", Component: FrontlineLeads },
      { path: "call-log", Component: FrontlineCallLog },
      { path: "tasks", Component: FrontlineTasks },
      { path: "settings", Component: FrontlineSettings },
    ],
  },
  {
    path: "/operations",
    element: (
      <ProtectedRoute role="OPERATIONS">
        <OperationsLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: OperationsDashboard },
      { path: "dashboard", element: <Navigate to="/operations/dashboard" replace /> },
      { path: "employees", Component: OperationsEmployees },
      { path: "tutors", Component: OperationsTutors },
      { path: "frontline-team", Component: OperationsFrontlineTeam },
      { path: "notifications", Component: OperationsNotifications },
      { path: "coupons", Component: OperationsCoupons },
      { path: "leads", Component: OperationsLeads },
      { path: "users", Component: OperationsUsers },
      { path: "classes", Component: OperationsClasses },
      { path: "recorded-classes", Component: OperationsRecordedClasses },
      { path: "events", Component: OperationsEvents },
      { path: "settings", Component: OperationsSettings },
    ],
  },
  {
    path: "/user",
    element: (
      <ProtectedRoute role="STUDENT">
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: UserDashboard },
      { path: "dashboard", element: <Navigate to="/user/dashboard" replace /> },
      { path: "classes", Component: UserClasses },
      { path: "recordings", Component: UserRecordings },
      { path: "attendance", Component: UserAttendance },
      { path: "referrals", Component: UserReferrals },
      { path: "events", Component: UserEvents },
      { path: "profile", Component: UserProfile },
      { path: "payments", Component: UserPayments },
      { path: "settings", Component: UserSettings },
      { path: "class-session/:classId", Component: UserClassSession },
      { path: "recording-player/:recordingId", Component: UserRecordingPlayer },
      { path: "self-paced", Component: UserSelfPaced },
      { path: "self-paced-course/:courseId", Component: UserSelfPacedCourse },
    ],
  },
]);
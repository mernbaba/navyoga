import { createBrowserRouter, Navigate } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { TutorLayout } from "./components/TutorLayout";
import { FrontlineLayout } from "./components/FrontlineLayout";
import { OperationsLayout } from "./components/OperationsLayout";
import { UserLayout } from "./components/UserLayout";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
import { Students } from "./pages/Students";
import { Employees } from "./pages/Employees";
import { Tutors } from "./pages/Tutors";
import { Classes } from "./pages/Classes";
import { Attendance } from "./pages/Attendance";
import { Financials } from "./pages/Financials";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { LoginMinimal } from "./pages/LoginMinimal";
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginMinimal />,
  },
  {
    path: "/login-minimal",
    element: <LoginMinimal />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
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
      <ProtectedRoute>
        <TutorLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: TutorDashboard },
      { path: "classes", Component: TutorClasses },
      { path: "students", Component: TutorStudents },
      { path: "settings", Component: TutorSettings },
      { path: "video-session", Component: VideoSession },
    ],
  },
  {
    path: "/frontline",
    element: (
      <ProtectedRoute>
        <FrontlineLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: FrontlineDashboard },
      { path: "dashboard", element: <Navigate to="/frontline" replace /> },
      { path: "leads", Component: FrontlineLeads },
      { path: "call-log", Component: FrontlineCallLog },
      { path: "tasks", Component: FrontlineTasks },
      { path: "settings", Component: FrontlineSettings },
    ],
  },
  {
    path: "/operations",
    element: (
      <ProtectedRoute>
        <OperationsLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: OperationsDashboard },
      { path: "dashboard", element: <Navigate to="/operations" replace /> },
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
      <ProtectedRoute>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: UserDashboard },
      { path: "dashboard", element: <Navigate to="/user" replace /> },
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
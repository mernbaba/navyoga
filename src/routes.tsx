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
import { ClassesLive } from "./pages/superadmin/classes/ClassesLive";
import { ClassesSelfPaced } from "./pages/superadmin/classes/ClassesSelfPaced";
import { SelfPacedModules } from "./pages/superadmin/classes/SelfPacedModules";
import { ClassesYTTLive } from "./pages/superadmin/classes/ClassesYTTLive";
import { ClassesYTTRecorded } from "./pages/superadmin/classes/ClassesYTTRecorded";
import { ClassesEvents } from "./pages/superadmin/classes/ClassesEvents";
import { ClassesWorkshops } from "./pages/superadmin/classes/ClassesWorkshops";
import { WorkshopSessions } from "./pages/superadmin/classes/WorkshopSessions";
import { Attendance } from "./pages/superadmin/Attendance";
import { FinancialsLayout } from "./pages/superadmin/financials/FinancialsLayout";
import { FinancialsOverview } from "./pages/superadmin/financials/FinancialsOverview";
import { FinancialsPayments } from "./pages/superadmin/financials/FinancialsPayments";
import { FinancialsCoupons } from "./pages/superadmin/financials/FinancialsCoupons";
import { MarketingAnalytics } from "./pages/superadmin/MarketingAnalytics";
import { Referrals } from "./pages/superadmin/Referrals";
import { Plans } from "./pages/superadmin/Plans";
import { Settings } from "./pages/superadmin/Settings";
import { UserLogin } from "./pages/auth/UserLogin";
import { UserRegister } from "./pages/auth/UserRegister";
import { SuperAdminLogin } from "./pages/auth/SuperAdminLogin";
import { TutorLogin } from "./pages/auth/TutorLogin";
import { OperationsLogin } from "./pages/auth/OperationsLogin";
import { FrontlineLogin } from "./pages/auth/FrontlineLogin";
import { TutorDashboard } from "./pages/tutor/TutorDashboard";
import { TutorClasses } from "./pages/tutor/TutorClasses";
import { TutorStudents } from "./pages/tutor/TutorStudents";
import { TutorAttendance } from "./pages/tutor/TutorAttendance";
import { TutorReferrals } from "./pages/tutor/TutorReferrals";
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
import { UserAttendance } from "./pages/user/UserAttendance";
import { UserProfile } from "./pages/user/UserProfile";
import { UserPayments } from "./pages/user/UserPayments";
import { UserSettings } from "./pages/user/UserSettings";
import { UserClassSession } from "./pages/user/UserClassSession";
import { UserSelfPaced } from "./pages/user/UserSelfPaced";
import { UserSelfPacedCourse } from "./pages/user/UserSelfPacedCourse";
import { UserReferrals } from "./pages/user/UserReferrals";
import { UserEvents } from "./pages/user/UserEvents";
import { UserYTTLive } from "./pages/user/UserYTTLive";
import { UserYTTRecorded } from "./pages/user/UserYTTRecorded";
import { UserYTTRecordedCourse } from "./pages/user/UserYTTRecordedCourse";

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
    path: "/register",
    element: <UserRegister />,
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
      {
        path: "classes",
        children: [
          { index: true, element: <Navigate to="/superadmin/classes/live" replace /> },
          { path: "live", Component: ClassesLive },
          {
            path: "self-paced",
            children: [
              { index: true, Component: ClassesSelfPaced },
              { path: "modules", Component: SelfPacedModules },
            ],
          },
          { path: "ytt-live", Component: ClassesYTTLive },
          { path: "ytt-recorded", Component: ClassesYTTRecorded },
          { path: "events", Component: ClassesEvents },
          { path: "workshops", Component: ClassesWorkshops },
          { path: "workshops/:id", Component: WorkshopSessions },
        ],
      },
      { path: "attendance", Component: Attendance },
      {
        path: "financials",
        Component: FinancialsLayout,
        children: [
          { index: true, Component: FinancialsOverview },
          { path: "payments", Component: FinancialsPayments },
          { path: "coupons", Component: FinancialsCoupons },
        ],
      },
      { path: "marketing-analytics", Component: MarketingAnalytics },
      { path: "referrals", Component: Referrals },
      { path: "plans", Component: Plans },
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
      { path: "attendance", Component: TutorAttendance },
      { path: "referrals", Component: TutorReferrals },
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
      { index: true, element: <Navigate to="/operations/dashboard" replace /> },
      { path: "dashboard", Component: OperationsDashboard },
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
      { index: true, element: <Navigate to="/user/dashboard" replace /> },
      { path: "dashboard", Component: UserDashboard },
      { path: "classes", Component: UserClasses },
      { path: "attendance", Component: UserAttendance },
      { path: "referrals", Component: UserReferrals },
      { path: "events", Component: UserEvents },
      { path: "profile", Component: UserProfile },
      { path: "subscriptions", Component: UserPayments },
      { path: "payments", element: <Navigate to="/user/subscriptions" replace /> },
      { path: "settings", Component: UserSettings },
      { path: "class-session/:classId", Component: UserClassSession },
      { path: "self-paced", Component: UserSelfPaced },
      { path: "self-paced/:courseId", Component: UserSelfPacedCourse },
      { path: "ytt-live", Component: UserYTTLive },
      { path: "ytt-recorded", Component: UserYTTRecorded },
      { path: "ytt-recorded/:courseId", Component: UserYTTRecordedCourse },
    ],
  },
]);
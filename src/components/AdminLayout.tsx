import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Gift,
  LayoutList,
  Settings as SettingsIcon,
  Menu,
  UserPlus,
  Briefcase,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { resolveAvatarUrl } from "../lib/media";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { performLogout, useRoleSession } from "../lib/session";

const navigation = [
  { name: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/superadmin/leads", icon: UserPlus },
  { name: "Sādhakas", href: "/superadmin/students", icon: Users },
  { name: "Employees", href: "/superadmin/employees", icon: Briefcase },
  { name: "Yoga Shikshaks", href: "/superadmin/tutors", icon: GraduationCap },
  { name: "Classes", href: "/superadmin/classes", icon: Calendar, expandable: true },
  { name: "Attendance", href: "/superadmin/attendance", icon: ClipboardCheck },
  { name: "Financials", href: "/superadmin/financials", icon: CreditCard },
  { name: "Plans", href: "/superadmin/plans", icon: LayoutList },
  { name: "Marketing Analytics", href: "/superadmin/marketing-analytics", icon: BarChart3 },
  { name: "Referrals", href: "/superadmin/referrals", icon: Gift },
  { name: "Settings", href: "/superadmin/settings", icon: SettingsIcon },
];

const classesSubNav = [
  { name: "Yoga Live", href: "/superadmin/classes/live" },
  { name: "Yoga Self Paced", href: "/superadmin/classes/self-paced" },
  { name: "YTT Live", href: "/superadmin/classes/ytt-live" },
  { name: "YTT Recorded", href: "/superadmin/classes/ytt-recorded" },
  { name: "Events", href: "/superadmin/classes/events" },
  { name: "Workshops", href: "/superadmin/classes/workshops" },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [classesOpen, setClassesOpen] = useState(
    location.pathname.startsWith("/superadmin/classes")
  );
  const { user } = useRoleSession("SUPERADMIN");

  const requestLogout = () => {
    setOpen(false);
    setLogoutOpen(true);
  };

  useEffect(() => {
    if (location.pathname.startsWith("/superadmin/classes")) {
      setClassesOpen(true);
    }
  }, [location.pathname]);

  const NavContent = () => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        if (item.expandable) {
          const isClassesActive = location.pathname.startsWith("/superadmin/classes");
          return (
            <div key={item.name}>
              <button
                onClick={() => setClassesOpen((o) => !o)}
                className={`w-full group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isClassesActive
                    ? "bg-[#610981] text-white shadow-lg shadow-[#ffac96]/40"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                }`}
              >
                {isClassesActive && (
                  <div className="absolute inset-0 bg-[#610981] rounded-xl blur-md opacity-50 -z-10" />
                )}
                <item.icon className={`w-5 h-5 shrink-0 ${isClassesActive ? "drop-shadow-lg" : ""}`} />
                <span className="flex-1 text-left">{item.name}</span>
                {classesOpen
                  ? <ChevronDown className="w-4 h-4 shrink-0" />
                  : <ChevronRight className="w-4 h-4 shrink-0" />
                }
              </button>
              {classesOpen && (
                <div className="mt-1 ml-3 pl-3 border-l-2 border-[#610981]/20 space-y-1">
                  {classesSubNav.map((child) => {
                    const isChildActive = location.pathname.replace(/\/+$/, "") === child.href;
                    return (
                      <Link
                        key={child.name}
                        to={child.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          isChildActive
                            ? "bg-[#610981]/12 text-[#610981] font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildActive ? "bg-[#610981]" : "bg-border"}`} />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const isActive =
          location.pathname === item.href ||
          location.pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setOpen(false)}
            className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-[#610981] text-white shadow-lg shadow-[#ffac96]/40"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md"
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 bg-[#610981] rounded-xl blur-md opacity-50 -z-10" />
            )}
            <item.icon
              className={`w-5 h-5 ${isActive ? "drop-shadow-lg" : ""}`}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const handleLogout = async () => {
    await performLogout("SUPERADMIN");
    navigate("/login/superadmin");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-linear-to-br from-[#ff691d]/10 to-[#ffac96]/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-linear-to-tr from-[#610981]/10 to-[#ff691d]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-linear-to-br from-[#ffac96]/5 to-[#610981]/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 p-0 bg-white/95 backdrop-blur-xl border-border/50"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-lg shadow-[#ffac96]/40">
                    <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="Navyoga" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: "#ff691d" }}
                    >
                      Navyoga Wellness
                    </h2>
                    <p className="text-xs" style={{ color: "#ffac96" }}>
                      Smart Admin Panel
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-lg shadow-[#ffac96]/40">
              <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="Navyoga" className="w-10 h-10 object-contain" />
            </div>
            <div className="hidden lg:block">
              <h1
                className="text-lg font-semibold"
                style={{ color: "#ff691d" }}
              >
                Navyoga Wellness
              </h1>
              <p className="text-xs" style={{ color: "#ffac96" }}>
                Yoga Samsthapak & Paramacharya Panel
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {user?.name && (
              <div className="hidden sm:flex items-center gap-2 pl-1">
                <Avatar className="size-8">
                  <AvatarImage
                    src={resolveAvatarUrl(user.avatar)}
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-linear-to-br from-[#610981] to-[#ff691d] text-white text-xs font-semibold">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground max-w-[160px] truncate">
                  {user.name}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={requestLogout}
              className="gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:pt-16">
        <div className="flex flex-col flex-1 min-h-0 bg-white/60 backdrop-blur-xl border-r border-border/50 shadow-sm">
          <div className="flex-1 overflow-y-auto p-4">
            <NavContent />
          </div>
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be returned to the login page and need to sign in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Settings as SettingsIcon,
  Menu,
  UserPlus,
  Briefcase,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { clearRoleAuth } from "../lib/auth";

const navigation = [
  { name: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/superadmin/leads", icon: UserPlus },
  { name: "Sādhakas", href: "/superadmin/students", icon: Users },
  { name: "Employees", href: "/superadmin/employees", icon: Briefcase },
  { name: "Yoga Shikshaks", href: "/superadmin/tutors", icon: GraduationCap },
  { name: "Classes", href: "/superadmin/classes", icon: Calendar },
  { name: "Attendance", href: "/superadmin/attendance", icon: ClipboardCheck },
  { name: "Financials", href: "/superadmin/financials", icon: CreditCard },
  { name: "Settings", href: "/superadmin/settings", icon: SettingsIcon },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
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

  const handleLogout = () => {
    clearRoleAuth("SUPERADMIN");
    toast.success("Logged out successfully!");
    navigate("/login/superadmin");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#ff691d]/10 to-[#ffac96]/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#610981]/10 to-[#ff691d]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#ffac96]/5 to-[#610981]/5 rounded-full blur-3xl animate-pulse"
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
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-lg shadow-[#ffac96]/40">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: "#ff691d" }}
                    >
                      NavYoga Academy
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
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-lg shadow-[#ffac96]/40">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="hidden lg:block">
              <h1
                className="text-lg font-semibold"
                style={{ color: "#ff691d" }}
              >
                NavYoga Academy
              </h1>
              <p
                className="text-xs flex items-center gap-1"
                style={{ color: "#ffac96" }}
              >
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Yoga Samsthapak & Paramacharya Panel
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#610981] text-[#610981]"
              >
                Yoga Samsthapak & Paramacharya
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="relative group overflow-hidden"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="relative z-10">Logout</span>
              <div className="absolute inset-0 bg-[#610981]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 border-r border-border/50 bg-white/60 backdrop-blur-xl min-h-[calc(100vh-4rem)] sticky top-16 shadow-sm">
          <div className="p-4">
            <NavContent />
          </div>
        </aside>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

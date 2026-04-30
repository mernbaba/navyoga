import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  BookOpen, 
  Video,
  Calendar,
  User as UserIcon,
  CreditCard,
  Settings as SettingsIcon,
  Menu,
  LogOut,
  Sparkles,
  GraduationCap,
  Gift,
  CalendarDays
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { performLogout, useRoleSession } from "../lib/session";

const navigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { name: 'My Classes', href: '/user/classes', icon: BookOpen },
  { name: 'Self-Paced', href: '/user/self-paced', icon: GraduationCap },
  { name: 'Recordings', href: '/user/recordings', icon: Video },
  { name: 'Attendance', href: '/user/attendance', icon: Calendar },
  { name: 'Events', href: '/user/events', icon: CalendarDays },
  { name: 'Referrals', href: '/user/referrals', icon: Gift },
  { name: 'Profile', href: '/user/profile', icon: UserIcon },
  { name: 'Payments', href: '/user/payments', icon: CreditCard },
  { name: 'Settings', href: '/user/settings', icon: SettingsIcon },
];

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useRoleSession("STUDENT");

  const handleLogout = async () => {
    await performLogout("STUDENT");
    navigate("/login");
  };

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
                ? 'bg-[#610981] text-white shadow-lg shadow-[#ffac96]/40'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 bg-[#610981] rounded-xl blur-md opacity-50 -z-10" />
            )}
            <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-lg' : ''}`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#ff691d]/10 to-[#ffac96]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#610981]/10 to-[#ff691d]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#ffac96]/5 to-[#610981]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white/95 backdrop-blur-xl border-border/50">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#610981] to-[#8b0fa8] rounded-xl shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg" style={{ color: '#ff691d' }}>NavYoga</h2>
                      <Badge variant="secondary" className="text-xs mt-1">Student Portal</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <NavContent />
                </div>
                <div className="p-4 border-t border-border/50">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#610981] to-[#8b0fa8] rounded-xl shadow-lg hidden sm:block">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg" style={{ color: '#ff691d' }}>NavYoga Academy</h1>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Sandeep Sandy</Badge>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden lg:flex gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
 
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:pt-16">
        <div className="flex flex-col flex-1 min-h-0 bg-white/80 backdrop-blur-xl border-r border-border/50">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto px-4">
            <NavContent />
          </div>
        </div>
      </div>
 
      <main className="lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
}
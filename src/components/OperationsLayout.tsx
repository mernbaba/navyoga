import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Phone,
  Bell,
  Ticket,
  UserPlus,
  CalendarDays,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { performLogout, useRoleSession } from '../lib/session';

type OpsNavItem = { name: string; href: string; icon: LucideIcon; expandable?: boolean };

const classesSubNav = [
  { name: 'Live', href: '/operations/classes/live' },
  { name: 'Self Paced', href: '/operations/classes/self-paced' },
  { name: 'YTT Live', href: '/operations/classes/ytt-live' },
  { name: 'YTT Recorded', href: '/operations/classes/ytt-recorded' },
  { name: 'Events', href: '/operations/classes/events' },
  { name: 'Workshops', href: '/operations/classes/workshops' },
];

export function OperationsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [classesOpen, setClassesOpen] = useState(
    location.pathname.startsWith('/operations/classes')
  );
  const { user } = useRoleSession("OPERATIONS");
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const opInitials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "OP";

  useEffect(() => {
    if (location.pathname.startsWith('/operations/classes')) {
      setClassesOpen(true);
    }
  }, [location.pathname]);

  const requestLogout = () => {
    setSidebarOpen(false);
    setLogoutOpen(true);
  };

  const handleLogout = async () => {
    await performLogout("OPERATIONS");
    navigate("/login/operations");
  };

  const navigation: OpsNavItem[] = [
    { name: 'Dashboard', href: '/operations/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/operations/employees', icon: Users },
    { name: 'Tutors', href: '/operations/tutors', icon: GraduationCap },
    { name: 'Frontline Team', href: '/operations/frontline-team', icon: Phone },
    { name: 'App Notifications', href: '/operations/notifications', icon: Bell },
    { name: 'Coupon Codes', href: '/operations/coupons', icon: Ticket },
    { name: 'Leads', href: '/operations/leads', icon: UserPlus },
    { name: 'Users', href: '/operations/users', icon: Users },
    { name: 'Classes', href: '/operations/classes', icon: CalendarDays, expandable: true },
    { name: 'Settings', href: '/operations/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
 
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
 
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-lg shadow-[#ffac96]/40 shrink-0">
                <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="NavYoga" className="w-10 h-10 object-contain" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight" style={{ color: '#ff691d' }}>NavYoga Academy</h2>
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#ffac96' }}>
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Operations Panel
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
 
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                if (item.expandable) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => setClassesOpen((o) => !o)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          active
                            ? 'text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={active ? { backgroundColor: '#610981' } : {}}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium flex-1 text-left">{item.name}</span>
                        {classesOpen
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {classesOpen && (
                        <div className="mt-1 ml-4 pl-3 border-l-2 border-[#610981]/15 space-y-1">
                          {classesSubNav.map((child) => {
                            const childActive = location.pathname === child.href;
                            return (
                              <Link
                                key={child.name}
                                to={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                                  childActive
                                    ? 'bg-[#610981]/12 text-[#610981] font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${childActive ? 'bg-[#610981]' : 'bg-gray-300'}`} />
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? 'text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={active ? { backgroundColor: '#610981' } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
 
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#610981' }}>
                {opInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fullName || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              </div>
            </div>
            <Button
              onClick={requestLogout}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
 
      <div className="lg:pl-64">
 
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-sm shrink-0">
              <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="NavYoga" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-base font-semibold" style={{ color: '#ff691d' }}>NavYoga Academy</h1>
          </div>
          <div className="w-10" />
        </header>
 
        <main>
          <Outlet />
        </main>
      </div>

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
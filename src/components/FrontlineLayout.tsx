import { NavLink, Outlet, useNavigate } from "react-router";
import { Phone, Users, ClipboardList, Settings, LogOut, LayoutDashboard, PhoneCall } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
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
  { name: "Dashboard", href: "/frontline/dashboard", icon: LayoutDashboard, end: true},
  { name: "Leads", href: "/frontline/leads", icon: Users },
  { name: "Call Log", href: "/frontline/call-log", icon: PhoneCall },
  { name: "Daily Tasks", href: "/frontline/tasks", icon: ClipboardList },
  { name: "Settings", href: "/frontline/settings", icon: Settings },
];

export function FrontlineLayout() {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { user } = useRoleSession("FRONTLINE");
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const handleLogout = async () => {
    await performLogout("FRONTLINE");
    navigate("/login/frontline");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r flex flex-col shadow-lg">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-lg shadow-[#ffac96]/40 shrink-0">
              <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="Navyoga" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight" style={{ color: '#ff691d' }}>Navyoga Wellness</h2>
              <p className="text-xs mt-0.5" style={{ color: '#ffac96' }}>
                Frontline Panel
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/frontline"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-linear-to-r from-[#610981] to-[#8b0fa8] text-white shadow-lg shadow-[#610981]/30"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                  <span className="font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-3 px-4 py-3 rounded-xl bg-linear-to-br from-[#ffac96]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
            <p className="text-sm font-semibold" style={{ color: '#ff691d' }}>{fullName || "-"}</p>
            <p className="text-xs text-muted-foreground">{user?.designation || "Frontline Agent"}</p>
          </div>
          <Button
            onClick={() => setLogoutOpen(true)}
            variant="outline"
            className="w-full justify-start gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
      <main data-scroll-container className="flex-1 overflow-y-auto">
        <Outlet />
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
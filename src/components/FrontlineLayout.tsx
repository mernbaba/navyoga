import { NavLink, Outlet, useNavigate } from "react-router";
import { Phone, Users, ClipboardList, Settings, LogOut, LayoutDashboard, PhoneCall } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/frontline", icon: LayoutDashboard, end: true},
  { name: "Leads", href: "/frontline/leads", icon: Users },
  { name: "Call Log", href: "/frontline/call-log", icon: PhoneCall },
  { name: "Daily Tasks", href: "/frontline/tasks", icon: ClipboardList },
  { name: "Settings", href: "/frontline/settings", icon: Settings },
];

export function FrontlineLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r flex flex-col shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#610981] to-[#8b0fa8] rounded-xl">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#ff691d' }}>NavYoga</h1>
              <p className="text-xs text-muted-foreground">Frontline Panel</p>
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
                    ? "bg-gradient-to-r from-[#610981] to-[#8b0fa8] text-white shadow-lg shadow-[#610981]/30"
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
          <div className="mb-3 px-4 py-3 rounded-xl bg-gradient-to-br from-[#ffac96]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
            <p className="text-sm font-semibold" style={{ color: '#ff691d' }}>Sarah Johnson</p>
            <p className="text-xs text-muted-foreground">Lead Generation Specialist</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
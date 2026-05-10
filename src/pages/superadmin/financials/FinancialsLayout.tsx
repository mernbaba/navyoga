import { Outlet, useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

type Tab = "overview" | "payments" | "coupons";

const TAB_PATHS: Record<Tab, string> = {
  overview: "/superadmin/financials",
  payments: "/superadmin/financials/payments",
  coupons: "/superadmin/financials/coupons",
};

function deriveTab(pathname: string): Tab {
  if (pathname.endsWith("/coupons")) return "coupons";
  if (pathname.endsWith("/payments")) return "payments";
  return "overview";
}

export function FinancialsLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const value = deriveTab(pathname);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>Financials</h1>
          <p className="mt-1" style={{ color: "#ffac96" }}>
            Manage payments, subscriptions, revenue, and discount coupons
          </p>
        </div>
      </div>

      <Tabs value={value} onValueChange={(v) => navigate(TAB_PATHS[v as Tab])}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}

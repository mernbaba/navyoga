import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Search,
  IndianRupee,
  TrendingUp,
  CreditCard,
  Banknote,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getFinancialsPaymentStats,
  listFinancialsPayments,
  type FinancialsPayment,
  type FinancialsPaymentStats,
  type PaymentStatus,
  type PaymentType,
} from "../../../api/financials";

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<PaymentType, string> = {
  LIVE: "Live Yoga",
  SELF_PACED: "Self-Paced",
  YTT_LIVE: "YTT Live",
  YTT_RECORDED: "YTT Recorded",
  EVENT: "Event",
  WORKSHOP: "Workshop",
};

function getStatusColor(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return "default" as const;
    case "PENDING":
      return "secondary" as const;
    case "FAILED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function getMethodIcon(method: string | null) {
  if (!method) return null;
  const m = method.toLowerCase();
  if (m.includes("card")) return <CreditCard className="w-4 h-4" />;
  if (m.includes("cash")) return <Banknote className="w-4 h-4" />;
  if (m.includes("upi")) return <IndianRupee className="w-4 h-4" />;
  return null;
}

export function FinancialsPayments() {
  const [stats, setStats] = useState<FinancialsPaymentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [payments, setPayments] = useState<FinancialsPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | PaymentType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    getFinancialsPaymentStats("SUPERADMIN")
      .then((res) => {
        if (!cancelled) setStats(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load payment stats";
          toast.error(message);
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPaymentsLoading(true);
    listFinancialsPayments("SUPERADMIN", {
      q: searchQuery || undefined,
      type: typeFilter === "ALL" ? undefined : typeFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setPayments(res.items);
          setTotalPages(res.totalPages);
          setTotal(res.total);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load payments";
          toast.error(message);
          setPayments([]);
          setTotalPages(1);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, typeFilter, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const subscriptionShare =
    stats && stats.revenue > 0
      ? Math.round((stats.subscriptionPayments / stats.revenue) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-semibold flex items-center gap-1">
                <IndianRupee className="w-6 h-6" />
                {(stats?.revenue ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">All-time paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-semibold text-green-500 flex items-center gap-1">
                <IndianRupee className="w-6 h-6" />
                {(stats?.revenueThisMonth ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">Paid this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Subscription Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-semibold flex items-center gap-1">
                <IndianRupee className="w-6 h-6" />
                {(stats?.subscriptionPayments ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">{subscriptionShare}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>One-Time Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-semibold flex items-center gap-2">
                <IndianRupee className="w-6 h-6" />
                {(stats?.oneTimePayments ?? 0).toLocaleString()}
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">Events &amp; workshops</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: "#ff691d" }}>Recent Payments</CardTitle>
          <CardDescription>View and search payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none z-10" />
              <Input
                placeholder="Search by student, payment ID, order ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "ALL" | PaymentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="LIVE">Live Yoga</SelectItem>
                <SelectItem value="SELF_PACED">Self-Paced</SelectItem>
                <SelectItem value="YTT_LIVE">YTT Live</SelectItem>
                <SelectItem value="YTT_RECORDED">YTT Recorded</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="WORKSHOP">Workshop</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "ALL" | PaymentStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading payments…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.student?.name ?? "—"}</div>
                        {payment.student?.email && (
                          <div className="text-xs text-muted-foreground">
                            {payment.student.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {payment.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{TYPE_LABEL[payment.type] ?? payment.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 capitalize">
                          {getMethodIcon(payment.method)}
                          {payment.method ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.status)}>
                          {payment.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div>
                Page {page} of {totalPages} · {total} total
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || paymentsLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || paymentsLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

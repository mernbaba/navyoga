import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Plus,
  Search,
  IndianRupee,
  Download,
  TrendingUp,
  CreditCard,
  Banknote,
} from "lucide-react";
import { payments as initialPayments, students, type Payment } from "../../../data/mockData";
import { toast } from "sonner";

function getStatusColor(status: string) {
  switch (status) {
    case "paid":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "overdue":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function getMethodIcon(method: string) {
  switch (method) {
    case "card":
      return <CreditCard className="w-4 h-4" />;
    case "cash":
      return <Banknote className="w-4 h-4" />;
    case "upi":
      return <IndianRupee className="w-4 h-4" />;
    default:
      return null;
  }
}

export function FinancialsPayments() {
  const [payments, setPayments] = useState(initialPayments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  const filteredPayments = payments.filter((payment) => {
    const student = students.find((s) => s.id === payment.studentId);
    const term = searchQuery.toLowerCase();
    return (
      student?.name.toLowerCase().includes(term) ||
      payment.id.toLowerCase().includes(term) ||
      payment.status.toLowerCase().includes(term)
    );
  });

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPayment: Payment = {
      id: `P${String(payments.length + 1).padStart(3, "0")}`,
      studentId: formData.get("studentId") as string,
      amount: parseInt(formData.get("amount") as string),
      date: formData.get("date") as string,
      type: formData.get("type") as "membership" | "class",
      status: "paid",
      method: formData.get("method") as "card" | "cash" | "upi",
    };
    setPayments([...payments, newPayment]);
    setIsAddPaymentOpen(false);
    toast.success("Payment recorded successfully");
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? student.name : "Unknown";
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-end">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: "#610981", color: "white" }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddPayment}>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Add a new payment transaction</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="studentId">Select Student</Label>
                  <Select name="studentId">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students
                        .filter((s) => s.status === "active")
                        .map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.id})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" min="0" placeholder="1500" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Payment Type</Label>
                  <Select name="type">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membership">Live Yoga Subscription</SelectItem>
                      <SelectItem value="class">Self-Paced Program</SelectItem>
                      <SelectItem value="class">YTT Self-Paced</SelectItem>
                      <SelectItem value="class">YTT Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select name="method">
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPaymentOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: "#610981", color: "white" }}>
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-500 flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {paidAmount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{paidCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-yellow-500 flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-2">
              {totalRevenue > 0 ? Math.round((paidAmount / totalRevenue) * 100) : 0}%
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: "#ff691d" }}>Recent Payments</CardTitle>
          <CardDescription>View and manage payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by student, payment ID, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{getStudentName(payment.studentId)}</TableCell>
                    <TableCell>
                      <div className="font-semibold flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {payment.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 capitalize">
                        {getMethodIcon(payment.method)}
                        {payment.method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

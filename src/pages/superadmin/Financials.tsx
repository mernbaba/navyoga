import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Plus, Search, IndianRupee, Download, TrendingUp, CreditCard, Banknote, Ticket, Copy, Trash2, Edit, Percent, Users, Zap, Heart, GraduationCap, Crown } from "lucide-react";
import { payments as initialPayments, students, type Payment } from "../../data/mockData";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

const monthlyData = [
  { month: 'Oct', revenue: 145000, subscriptions: 289 },
  { month: 'Nov', revenue: 162000, subscriptions: 312 },
  { month: 'Dec', revenue: 158000, subscriptions: 298 },
  { month: 'Jan', revenue: 181000, subscriptions: 342 },
  { month: 'Feb', revenue: 175000, subscriptions: 328 },
  { month: 'Mar', revenue: 198000, subscriptions: 365 },
];
 
const subscriptionBreakdown = [
  { name: 'Live Yoga - Inaugural', value: 145, revenue: 72550, color: '#ff691d' },
  { name: 'Live Yoga - Regular', value: 89, revenue: 88911, color: '#ff9d5c' },
  { name: 'Self-Paced', value: 78, revenue: 31122, color: '#ffac96' },
  { name: 'YTT Self-Paced', value: 23, revenue: 183977, color: '#610981' },
  { name: 'YTT Live', value: 12, revenue: 215988, color: '#8b2fb8' },
];

 
const planDistribution = [
  { name: 'Monthly', value: 187, color: '#ff691d' },
  { name: 'Quarterly', value: 98, color: '#ffac96' },
  { name: 'Half-Yearly', value: 45, color: '#610981' },
  { name: 'Yearly', value: 35, color: '#8b2fb8' },
];

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'disabled';
  usageLimit: number;
  usedCount: number;
  createdDate: string;
  applicableTo?: string[];
}

const initialCoupons: Coupon[] = [
  {
    id: 'C001',
    code: 'WELCOME50',
    discountType: 'percentage',
    discountValue: 50,
    minPurchase: 1000,
    maxDiscount: 500,
    expiryDate: '2026-12-31',
    status: 'active',
    usageLimit: 200,
    usedCount: 87,
    createdDate: '2026-01-01',
    applicableTo: ['Live Yoga - Inaugural', 'Live Yoga - Regular'],
  },
  {
    id: 'C002',
    code: 'YOGAINAUGURAL',
    discountType: 'percentage',
    discountValue: 30,
    minPurchase: 1500,
    maxDiscount: 750,
    expiryDate: '2026-06-30',
    status: 'active',
    usageLimit: 100,
    usedCount: 34,
    createdDate: '2026-01-15',
    applicableTo: ['Live Yoga - Inaugural'],
  },
  {
    id: 'C003',
    code: 'SELFPACED20',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 500,
    maxDiscount: 300,
    expiryDate: '2026-08-31',
    status: 'active',
    usageLimit: 150,
    usedCount: 56,
    createdDate: '2026-02-01',
    applicableTo: ['Self-Paced'],
  },
  {
    id: 'C004',
    code: 'YTT1000',
    discountType: 'fixed',
    discountValue: 1000,
    minPurchase: 8000,
    expiryDate: '2026-09-30',
    status: 'active',
    usageLimit: 50,
    usedCount: 12,
    createdDate: '2026-02-15',
    applicableTo: ['YTT Self-Paced', 'YTT Live'],
  },
  {
    id: 'C005',
    code: 'EARLYBIRD',
    discountType: 'percentage',
    discountValue: 25,
    minPurchase: 2000,
    maxDiscount: 1000,
    expiryDate: '2026-04-30',
    status: 'active',
    usageLimit: 75,
    usedCount: 45,
    createdDate: '2026-01-01',
    applicableTo: ['Live Yoga - Regular', 'YTT Live'],
  },
];

export function Financials() {
  const [payments, setPayments] = useState(initialPayments);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [couponSearchQuery, setCouponSearchQuery] = useState("");
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const filteredPayments = payments.filter(payment => {
    const student = students.find(s => s.id === payment.studentId);
    return student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.status.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(couponSearchQuery.toLowerCase()) ||
    coupon.status.toLowerCase().includes(couponSearchQuery.toLowerCase())
  );

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPayment: Payment = {
      id: `P${String(payments.length + 1).padStart(3, '0')}`,
      studentId: formData.get('studentId') as string,
      amount: parseInt(formData.get('amount') as string),
      date: formData.get('date') as string,
      type: formData.get('type') as 'membership' | 'class',
      status: 'paid',
      method: formData.get('method') as 'card' | 'cash' | 'upi',
    };
    setPayments([...payments, newPayment]);
    setIsAddPaymentOpen(false);
    toast.success('Payment recorded successfully');
  };

  const handleAddCoupon = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `C${String(coupons.length + 1).padStart(3, '0')}`,
      code: (formData.get('code') as string).toUpperCase(),
      discountType: formData.get('discountType') as 'percentage' | 'fixed',
      discountValue: parseInt(formData.get('discountValue') as string),
      minPurchase: parseInt(formData.get('minPurchase') as string),
      maxDiscount: formData.get('maxDiscount') ? parseInt(formData.get('maxDiscount') as string) : undefined,
      expiryDate: formData.get('expiryDate') as string,
      status: formData.get('status') as 'active' | 'expired' | 'disabled',
      usageLimit: parseInt(formData.get('usageLimit') as string),
      usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      createdDate: editingCoupon ? editingCoupon.createdDate : new Date().toISOString().split('T')[0],
    };

    if (editingCoupon) {
      setCoupons(coupons.map(c => c.id === editingCoupon.id ? newCoupon : c));
      toast.success('Coupon updated successfully');
    } else {
      setCoupons([...coupons, newCoupon]);
      toast.success('Coupon created successfully');
    }
    
    setIsAddCouponOpen(false);
    setEditingCoupon(null);
  };

  const handleDeleteCoupon = (id: string) => {
    setCoupons(coupons.filter(c => c.id !== id));
    toast.success('Coupon deleted successfully');
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied to clipboard');
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'active': return 'default';
      case 'expired': return 'secondary';
      case 'disabled': return 'destructive';
      default: return 'outline';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'upi': return <IndianRupee className="w-4 h-4" />;
      default: return null;
    }
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'paid').length;

  const activeCoupons = coupons.filter(c => c.status === 'active').length;
  const totalCoupons = coupons.length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const expiredCoupons = coupons.filter(c => c.status === 'expired').length;

  // Calculate subscription metrics
  const totalSubscriptions = subscriptionBreakdown.reduce((sum, s) => sum + s.value, 0);
  const subscriptionRevenue = subscriptionBreakdown.reduce((sum, s) => sum + s.revenue, 0);
  const avgRevenuePerSubscription = Math.round(subscriptionRevenue / totalSubscriptions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Financials</h1>
          <p className="mt-1" style={{ color: '#ffac96' }}>Manage payments, subscriptions, revenue, and discount coupons</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>
 
        <TabsContent value="overview" className="space-y-6">
 
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold flex items-center gap-1">
                  <IndianRupee className="w-6 h-6" />
                  {subscriptionRevenue.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-green-500 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  {totalSubscriptions}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Across all plans</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Avg. Revenue/User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold flex items-center gap-1" style={{ color: '#610981' }}>
                  <IndianRupee className="w-6 h-6" />
                  {avgRevenuePerSubscription.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Per subscription</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold flex items-center gap-2">
                  13.1%
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">vs. last month</p>
              </CardContent>
            </Card>
          </div>
 
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ff691d' }}>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue for the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#ff691d" 
                      strokeWidth={3}
                      dot={{ fill: '#ff691d', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ff691d' }}>Subscription Growth</CardTitle>
                <CardDescription>New subscriptions per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="subscriptions" fill="#610981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
 
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ff691d' }}>Revenue by Subscription Type</CardTitle>
                <CardDescription>Distribution of revenue across different plans</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {subscriptionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ff691d' }}>Plan Duration Distribution</CardTitle>
                <CardDescription>Subscribers by billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
 
          <div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#ff691d' }}>Subscription Breakdown</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {subscriptionBreakdown.map((sub, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                    style={{ backgroundColor: sub.color }}
                  />
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${sub.color}20` }}>
                        {index === 0 && <Zap className="w-5 h-5" style={{ color: sub.color }} />}
                        {index === 1 && <Crown className="w-5 h-5" style={{ color: sub.color }} />}
                        {index === 2 && <Heart className="w-5 h-5" style={{ color: sub.color }} />}
                        {(index === 3 || index === 4) && <GraduationCap className="w-5 h-5" style={{ color: sub.color }} />}
                      </div>
                      <CardTitle className="text-sm" style={{ color: sub.color }}>{sub.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-2xl font-bold">{sub.value}</p>
                        <p className="text-xs text-muted-foreground">Subscribers</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold flex items-center gap-1" style={{ color: sub.color }}>
                          <IndianRupee className="w-4 h-4" />
                          {sub.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
 
        <TabsContent value="payments" className="space-y-6">
          <div className="flex gap-2 justify-end">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: '#610981', color: 'white' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddPayment}>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Add a new payment transaction
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="studentId">Select Student</Label>
                      <Select name="studentId">
                        <SelectTrigger>
                          <SelectValue placeholder="Choose student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.filter(s => s.status === 'active').map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0"
                        placeholder="1500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Payment Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
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
                    <Button type="button" variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" style={{ backgroundColor: '#610981', color: 'white' }}>Record Payment</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
 
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Total Revenue</CardTitle>
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
                <CardTitle style={{ color: '#ffac96' }}>Paid Amount</CardTitle>
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
                <CardTitle style={{ color: '#ffac96' }}>Pending Amount</CardTitle>
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
                <CardTitle style={{ color: '#ffac96' }}>Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold flex items-center gap-2">
                  {Math.round((paidAmount / totalRevenue) * 100)}%
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
 
          <Card>
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Recent Payments</CardTitle>
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
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="coupons" className="space-y-6">
          <div className="flex gap-2 justify-end">
            <Dialog open={isAddCouponOpen} onOpenChange={(open) => {
              setIsAddCouponOpen(open);
              if (!open) setEditingCoupon(null);
            }}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: '#610981', color: 'white' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleAddCoupon}>
                  <DialogHeader>
                    <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                    <DialogDescription>
                      {editingCoupon ? 'Update coupon details' : 'Add a new discount coupon for students'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input
                          id="code"
                          name="code"
                          placeholder="WELCOME50"
                          defaultValue={editingCoupon?.code}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={editingCoupon?.status || 'active'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="discountType">Discount Type</Label>
                        <Select name="discountType" defaultValue={editingCoupon?.discountType || 'percentage'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="discountValue">Discount Value</Label>
                        <Input
                          id="discountValue"
                          name="discountValue"
                          type="number"
                          min="0"
                          placeholder="50"
                          defaultValue={editingCoupon?.discountValue}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="minPurchase">Min Purchase Amount (₹)</Label>
                        <Input
                          id="minPurchase"
                          name="minPurchase"
                          type="number"
                          min="0"
                          placeholder="1000"
                          defaultValue={editingCoupon?.minPurchase}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxDiscount">Max Discount (₹) - Optional</Label>
                        <Input
                          id="maxDiscount"
                          name="maxDiscount"
                          type="number"
                          min="0"
                          placeholder="500"
                          defaultValue={editingCoupon?.maxDiscount}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usageLimit">Usage Limit</Label>
                        <Input
                          id="usageLimit"
                          name="usageLimit"
                          type="number"
                          min="1"
                          placeholder="100"
                          defaultValue={editingCoupon?.usageLimit}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          type="date"
                          defaultValue={editingCoupon?.expiryDate}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddCouponOpen(false);
                      setEditingCoupon(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" style={{ backgroundColor: '#610981', color: 'white' }}>
                      {editingCoupon ? 'Update' : 'Create'} Coupon
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
 
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Total Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold flex items-center gap-2">
                  <Ticket className="w-6 h-6" />
                  {totalCoupons}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Active Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-green-500 flex items-center gap-2">
                  {activeCoupons}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Currently available</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Total Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold flex items-center gap-2">
                  {totalUsage}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Times redeemed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#ffac96' }}>Expired</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-red-500 flex items-center gap-2">
                  {expiredCoupons}
                </div>
              </CardContent>
            </Card>
          </div>
 
          <Card>
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Discount Coupons</CardTitle>
              <CardDescription>Manage promotional discount codes for NavYoga Academy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by coupon code or status..."
                    value={couponSearchQuery}
                    onChange={(e) => setCouponSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Min Purchase</TableHead>
                      <TableHead>Applicable To</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{coupon.code}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold">
                            {coupon.discountType === 'percentage' ? (
                              <>
                                <Percent className="w-3 h-3" />
                                {coupon.discountValue}%
                              </>
                            ) : (
                              <>
                                <IndianRupee className="w-3 h-3" />
                                {coupon.discountValue}
                              </>
                            )}
                            {coupon.maxDiscount && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (max ₹{coupon.maxDiscount})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {coupon.minPurchase}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {coupon.applicableTo ? (
                              coupon.applicableTo.slice(0, 2).map((plan, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {plan.split(' - ')[0]}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">All Plans</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-semibold">{coupon.usedCount}</span> / {coupon.usageLimit}
                            <div className="text-xs text-muted-foreground">
                              {Math.round((coupon.usedCount / coupon.usageLimit) * 100)}% used
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(coupon.expiryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(coupon.status)}>
                            {coupon.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingCoupon(coupon);
                                setIsAddCouponOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

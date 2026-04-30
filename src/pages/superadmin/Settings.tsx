import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Switch } from "../../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Building2, Bell, Shield, Globe, Activity, Users, Database, Clock } from "lucide-react";
import { toast } from "sonner";

const recentActivities = [
  { id: 1, action: 'Student Added', user: 'Admin', details: 'New student Priya Sharma registered', timestamp: '2026-03-04 10:30 AM', type: 'create' },
  { id: 2, action: 'Payment Received', user: 'System', details: 'Payment of ₹1,500 from Rahul Patel', timestamp: '2026-03-04 09:15 AM', type: 'payment' },
  { id: 3, action: 'Class Updated', user: 'Admin', details: 'Morning Hatha Flow schedule changed', timestamp: '2026-03-03 04:20 PM', type: 'update' },
  { id: 4, action: 'Tutor Added', user: 'Admin', details: 'New tutor Yogi Deepa onboarded', timestamp: '2026-03-03 02:10 PM', type: 'create' },
  { id: 5, action: 'Settings Changed', user: 'Admin', details: 'Email notifications enabled', timestamp: '2026-03-03 11:45 AM', type: 'update' },
];

export function Settings() {
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Settings saved successfully');
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'payment': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your yoga center configuration</p>
      </div>
 
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-semibold text-green-500">Active</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-semibold">47</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students, Tutors & Staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-semibold">2.4 MB</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Storage used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-semibold">99.9%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
 
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <CardTitle>Business Information</CardTitle>
            </div>
            <CardDescription>Update your yoga center details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="centerName">Center Name</Label>
                <Input id="centerName" defaultValue="Yoga Center" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="admin@yogacenter.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+91 98765 12345" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Wellness Street, Mumbai, India" />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
 
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="Asia/Kolkata (GMT+5:30)" readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" defaultValue="INR (₹)" readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" defaultValue="English" readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
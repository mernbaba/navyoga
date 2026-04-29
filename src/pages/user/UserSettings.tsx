import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Bell, Lock, CreditCard, Shield } from "lucide-react";
import { Link } from "react-router";

export function UserSettings() {
  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
 
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and security</p>
        </div>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: '#ff691d' }} />
              <CardTitle style={{ color: '#ff691d' }}>Notification Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Class Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified before your classes start</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">New Recording Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notified when new recordings are available</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Achievement Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you earn achievements</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#610981]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" style={{ color: '#ff691d' }} />
              <CardTitle style={{ color: '#ff691d' }}>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                </div>
                <Button style={{ backgroundColor: '#610981', color: 'white' }}>
                  Update Password
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: '#ff691d' }} />
              <CardTitle style={{ color: '#ff691d' }}>Payment & Billing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2" style={{ borderColor: '#10b981' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Premium Membership</p>
                    <p className="text-sm text-muted-foreground">Active until May 10, 2026</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                    Active
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Plan</span>
                  <span className="font-semibold">₹999/month</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                  </div>
                  <Link to="/user/payments">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Renewal</Label>
                  <p className="text-sm text-muted-foreground">Automatically renew your membership</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Link to="/user/payments">
                <Button variant="outline" className="w-full">
                  View Full Payment Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: '#ff691d' }} />
              <CardTitle style={{ color: '#ff691d' }}>Privacy & Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Download My Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Terms of Service
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
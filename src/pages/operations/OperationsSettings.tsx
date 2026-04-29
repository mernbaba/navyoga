import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { User, Lock } from "lucide-react";
import { toast } from "sonner";

export function OperationsSettings() {
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Password changed successfully');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffac96' }}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle style={{ color: '#ff691d' }}>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    First Name
                  </Label>
                  <Input id="firstName" defaultValue="Operations" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Last Name
                  </Label>
                  <Input id="lastName" defaultValue="Manager" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Email
                  </Label>
                  <Input id="email" type="email" defaultValue="operations@navyoga.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Phone
                  </Label>
                  <Input id="phone" defaultValue="+91 98765 43200" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="employeeId" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Employee ID
                  </Label>
                  <Input id="employeeId" defaultValue="OPS-2024-001" disabled className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="department" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Department
                  </Label>
                  <Input id="department" defaultValue="Operations" disabled className="mt-1" />
                </div>
              </div>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#610981]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#610981] to-[#8b0fa8]">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle style={{ color: '#ff691d' }}>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Current Password
                  </Label>
                  <Input id="currentPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    New Password
                  </Label>
                  <Input id="newPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Confirm Password
                  </Label>
                  <Input id="confirmPassword" type="password" className="mt-1" />
                </div>
              </div>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
 
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Work Preferences</CardTitle>
            <CardDescription>Set your work preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workingHours" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Working Hours
                  </Label>
                  <select id="workingHours" className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>9:00 AM - 6:00 PM</option>
                    <option>10:00 AM - 7:00 PM</option>
                    <option>11:00 AM - 8:00 PM</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-sm font-medium" style={{ color: '#ffac96' }}>
                    Timezone
                  </Label>
                  <select id="timezone" className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>IST (UTC+5:30)</option>
                    <option>EST (UTC-5:00)</option>
                    <option>PST (UTC-8:00)</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={() => toast.success('Work preferences updated')}
                className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

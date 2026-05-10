import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { User } from "lucide-react";
import { toast } from "sonner";
import { PasswordChangeCard } from "../../components/settings/PasswordChangeCard";
import { getMe, patchMe } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import type { OperationsUser } from "../../api/types";

export function OperationsSettings() {
  const [user, setUser] = useState<OperationsUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const loadProfile = () => {
    getMe("OPERATIONS")
      .then((fresh) => {
        setUser(fresh);
        setFirstName(fresh.firstName);
        setLastName(fresh.lastName);
        setEmail(fresh.email);
        setPhone(fresh.phone);
        setWorkingHours(fresh.workingHours ?? "");
        setTimezone(fresh.timezone);
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to load profile."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updated = await patchMe("OPERATIONS", { firstName, lastName, email, phone });
      setUser(updated);
      setCachedUser("OPERATIONS", updated);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (isSavingPrefs) return;
    setIsSavingPrefs(true);
    try {
      const updated = await patchMe("OPERATIONS", { workingHours, timezone });
      setUser(updated);
      setCachedUser("OPERATIONS", updated);
      toast.success("Work preferences updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences.");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#ffac96" }}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle style={{ color: "#ff691d" }}>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" style={{ color: "#ffac96" }}>First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" style={{ color: "#ffac96" }}>Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" style={{ color: "#ffac96" }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" style={{ color: "#ffac96" }}>Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="employeeId" style={{ color: "#ffac96" }}>Employee ID</Label>
                  <Input id="employeeId" value={user?.employeeId ?? ""} disabled className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="department" style={{ color: "#ffac96" }}>Department</Label>
                  <Input id="department" value={user?.department ?? ""} disabled className="mt-1" />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading || isSaving}
                className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PasswordChangeCard role="OPERATIONS" />

        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Work Preferences</CardTitle>
            <CardDescription>Set your work preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workingHours" style={{ color: "#ffac96" }}>Working Hours</Label>
                  <Input
                    id="workingHours"
                    value={workingHours}
                    onChange={(event) => setWorkingHours(event.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                    placeholder="9:00 AM - 6:00 PM"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" style={{ color: "#ffac96" }}>Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                    placeholder="Asia/Kolkata"
                  />
                </div>
              </div>
              <Button
                onClick={handleSavePreferences}
                disabled={isLoading || isSavingPrefs}
                className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                {isSavingPrefs ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

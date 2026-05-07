import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getMe, patchMe } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import type { StudentUser } from "../../api/types";

export function UserProfile() {
  const [profile, setProfile] = useState<StudentUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingMedical, setIsSavingMedical] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe("STUDENT")
      .then((fresh) => {
        if (cancelled) return;
        setProfile(fresh);
        setName(fresh.name);
        setEmail(fresh.email);
        setPhone(fresh.phone);
        setAddress(fresh.address ?? "");
        setAge(fresh.age ?? "");
        setBloodGroup(fresh.bloodGroup ?? "");
        setEmergencyContact(fresh.emergencyContact ?? "");
        setMedicalConditions(fresh.medicalConditions ?? "");
        setCurrentLevel(fresh.currentLevel ?? "");
        setAreasOfInterest(fresh.areasOfInterest ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load profile.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const savePartial = async (
    body: Record<string, unknown>,
    onDone: (saving: boolean) => void,
    successMsg: string,
  ) => {
    onDone(true);
    try {
      const updated = await patchMe("STUDENT", body);
      setProfile(updated);
      setCachedUser("STUDENT", updated);
      toast.success(successMsg);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      onDone(false);
    }
  };

  const handleSavePersonal = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingPersonal) return;
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    void savePartial(
      { name, email, phone, address: address || null },
      setIsSavingPersonal,
      "Profile updated successfully.",
    );
  };

  const handleSaveMedical = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingMedical) return;
    void savePartial(
      {
        age: age === "" ? null : Number(age),
        bloodGroup: bloodGroup || null,
        emergencyContact: emergencyContact || null,
        medicalConditions: medicalConditions || null,
      },
      setIsSavingMedical,
      "Medical information updated.",
    );
  };

  const handleSavePreferences = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingPrefs) return;
    void savePartial(
      {
        currentLevel: currentLevel || null,
        areasOfInterest: areasOfInterest || null,
      },
      setIsSavingPrefs,
      "Preferences updated.",
    );
  };

  const memberSince = profile ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information and track your progress</p>
          </div>
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border"
            style={{ borderColor: "#ff691d40", backgroundColor: "#ff691d10", color: "#ff691d" }}
          >
            <Calendar className="w-4 h-4" />
            Member since {memberSince}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#61098120" }}>
                    <User className="w-12 h-12" style={{ color: "#610981" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: "#ff691d" }} />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" disabled={isLoading} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: "#610981" }} />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-9"
                      disabled={isLoading}
                      required
                      title="Enter a 10-digit phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 pointer-events-none z-10" style={{ color: "#10b981" }} />
                    <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9" rows={3} disabled={isLoading} />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading || isSavingPersonal} className="w-full" style={{ backgroundColor: "#610981", color: "white" }}>
                  {isSavingPersonal ? "Saving..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Medical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveMedical} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodgroup">Blood Group</Label>
                  <Input id="bloodgroup" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency">Emergency Contact</Label>
                  <Input id="emergency" type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditions">Medical Conditions</Label>
                  <Textarea id="conditions" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} disabled={isLoading} maxLength={2000} rows={3} />
                </div>
                <Button type="submit" disabled={isLoading || isSavingMedical} className="w-full" variant="outline">
                  {isSavingMedical ? "Saving..." : "Update Medical Info"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Current Level</Label>
                  <Input id="level" value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} disabled={isLoading} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Areas of Interest</Label>
                  <Textarea id="interests" value={areasOfInterest} onChange={(e) => setAreasOfInterest(e.target.value)} disabled={isLoading} rows={2} maxLength={500} />
                </div>
                <Button type="submit" disabled={isLoading || isSavingPrefs} className="w-full" style={{ backgroundColor: "#ff691d", color: "white" }}>
                  {isSavingPrefs ? "Saving..." : "Update Preferences"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

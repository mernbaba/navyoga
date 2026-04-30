import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { User, Mail, Phone, MapPin, Calendar, Award, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getMe, patchMe } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import type { StudentUser } from "../../api/types";

const achievements = [
  { id: 1, title: "30-Day Streak", description: "Attended classes for 30 consecutive days", icon: "🔥", date: "Earned on Mar 1, 2026" },
  { id: 2, title: "Early Bird", description: "Attended 10 morning classes", icon: "🌅", date: "Earned on Feb 15, 2026" },
  { id: 3, title: "Meditation Master", description: "Completed 20 meditation sessions", icon: "🧘", date: "Earned on Feb 28, 2026" },
  { id: 4, title: "Flexible Warrior", description: "Achieved advanced flexibility poses", icon: "💪", date: "Earned on Jan 20, 2026" },
];

const healthGoals = [
  { goal: "Improve Flexibility", progress: 75, target: "Achieve full splits by June 2026" },
  { goal: "Build Core Strength", progress: 60, target: "Hold plank for 5 minutes" },
  { goal: "Master Meditation", progress: 85, target: "30 minutes daily meditation" },
];

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
  const [yogaExperience, setYogaExperience] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState("");
  const [fitnessGoals, setFitnessGoals] = useState("");
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
        setYogaExperience(fresh.yogaExperience ?? "");
        setCurrentLevel(fresh.currentLevel ?? "");
        setAreasOfInterest(fresh.areasOfInterest ?? "");
        setFitnessGoals(fresh.fitnessGoals ?? "");
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
        yogaExperience: yogaExperience || null,
        currentLevel: currentLevel || null,
        areasOfInterest: areasOfInterest || null,
        fitnessGoals: fitnessGoals || null,
      },
      setIsSavingPrefs,
      "Preferences updated.",
    );
  };

  const memberSince = profile ? new Date(profile.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";

  const profileStats = [
    { title: "Member Since", value: memberSince, icon: Calendar, color: "#ff691d" },
    { title: "Student ID", value: profile?.studentId ?? "—", icon: Target, color: "#610981" },
    { title: "Achievements", value: "12", icon: Award, color: "#10b981" },
    { title: "Skill Level", value: currentLevel || "—", icon: TrendingUp, color: "#f59e0b" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and track your progress</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {profileStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ backgroundColor: stat.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
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
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" disabled={isLoading} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" disabled={isLoading} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Health Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {healthGoals.map((item) => (
                  <div key={item.goal} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.goal}</span>
                      <span className="text-xs font-semibold">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${item.progress}%`, backgroundColor: "#610981" }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.target}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow border-2" style={{ borderColor: "#10b981" }}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <div>
                        <h4 className="font-semibold mb-1">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                        <Badge variant="secondary" className="text-xs">{achievement.date}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
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
                  <Label htmlFor="experience">Yoga Experience</Label>
                  <Input id="experience" value={yogaExperience} onChange={(e) => setYogaExperience(e.target.value)} disabled={isLoading} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Current Level</Label>
                  <Input id="level" value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} disabled={isLoading} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Areas of Interest</Label>
                  <Textarea id="interests" value={areasOfInterest} onChange={(e) => setAreasOfInterest(e.target.value)} disabled={isLoading} rows={2} maxLength={500} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goals">Fitness Goals</Label>
                  <Textarea id="goals" value={fitnessGoals} onChange={(e) => setFitnessGoals(e.target.value)} disabled={isLoading} rows={3} maxLength={500} />
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

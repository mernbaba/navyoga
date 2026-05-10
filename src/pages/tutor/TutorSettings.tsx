import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { User } from "lucide-react";
import { toast } from "sonner";
import { PasswordChangeCard } from "../../components/settings/PasswordChangeCard";
import { getMe, patchMe } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import type { TutorUser } from "../../api/types";

export function TutorSettings() {
  const [user, setUser] = useState<TutorUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState<number | "">("");
  const [specializations, setSpecializations] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe("TUTOR")
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        setName(fresh.name);
        setEmail(fresh.email);
        setPhone(fresh.phone);
        setBio(fresh.bio ?? "");
        setExperience(fresh.experience ?? "");
        setSpecializations((fresh.specializations ?? []).join(", "));
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load profile.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        email,
        phone,
        bio: bio || null,
      };
      if (experience !== "") body.experience = Number(experience);
      const specs = specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (specs.length || (user?.specializations?.length ?? 0) > 0) body.specializations = specs;
      const updated = await patchMe("TUTOR", body);
      setUser(updated);
      setCachedUser("TUTOR", updated);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: "#ff691d" }} />
              <CardTitle style={{ color: "#ff691d" }}>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={80}
                  value={experience}
                  onChange={(event) =>
                    setExperience(event.target.value === "" ? "" : Number(event.target.value))
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specializations">Specializations (comma-separated)</Label>
                <Input
                  id="specializations"
                  value={specializations}
                  onChange={(event) => setSpecializations(event.target.value)}
                  disabled={isLoading}
                  placeholder="Hatha, Vinyasa, Ashtanga"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  disabled={isLoading}
                  maxLength={2000}
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || isSaving}
                className="w-full bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PasswordChangeCard role="TUTOR" />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Mail, Phone, MapPin, Calendar, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getMe, patchMe, uploadStudentAvatar, removeStudentAvatar } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import { resolveAvatarUrl } from "../../lib/media";
import type { StudentUser } from "../../api/types";

const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export function UserProfile() {
  const [profile, setProfile] = useState<StudentUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getMe("STUDENT")
      .then((fresh) => {
        if (cancelled) return;
        setProfile(fresh);
        setName(fresh.name);
        setEmail(fresh.email);
        setPhone(fresh.phone);
        setCity(fresh.city ?? "");
        setCountry(fresh.country ?? "");
        setGender(fresh.gender ?? "");
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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so re-selecting the same file fires onChange again.
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Avatar must be a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Avatar must be 5 MB or smaller.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const storePath = await uploadStudentAvatar(file);
      // Persist the new path; the BE deletes the previously stored avatar.
      const updated = await patchMe("STUDENT", { avatar: storePath });
      setProfile(updated);
      setCachedUser("STUDENT", updated);
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (isUploadingAvatar || !profile?.avatar) return;
    setIsUploadingAvatar(true);
    try {
      await removeStudentAvatar();
      const updated = { ...profile, avatar: null };
      setProfile(updated);
      setCachedUser("STUDENT", updated);
      toast.success("Profile photo removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSavePersonal = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingPersonal) return;
    if (!/^\d{8,15}$/.test(phone)) {
      toast.error("Phone must be 8-15 digits including country code (no '+').");
      return;
    }
    const phoneChanged = profile?.phone !== phone;
    void savePartial(
      { name, email, phone, city: city || null, country: country || null, gender: gender || null },
      setIsSavingPersonal,
      phoneChanged
        ? "Profile updated. Please verify your new phone number to continue."
        : "Profile updated successfully.",
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
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div className="flex flex-col items-center justify-center mb-6 gap-3">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isLoading || isUploadingAvatar}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isLoading || isUploadingAvatar}
                    className="group relative w-24 h-24 rounded-full overflow-hidden border-2 disabled:cursor-not-allowed"
                    style={{ borderColor: "#61098130" }}
                    aria-label="Change profile photo"
                  >
                    <img
                      src={resolveAvatarUrl(profile?.avatar)}
                      alt={profile?.name ? `${profile.name}'s avatar` : "Profile photo"}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
                        isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </span>
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isLoading || isUploadingAvatar}
                      className="text-xs font-medium disabled:opacity-50"
                      style={{ color: "#610981" }}
                    >
                      {isUploadingAvatar ? "Uploading…" : profile?.avatar ? "Change photo" : "Upload photo"}
                    </button>
                    {profile?.avatar ? (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isLoading || isUploadingAvatar}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    ) : null}
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
                      pattern="\d{8,15}"
                      maxLength={15}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                      className="pl-9"
                      disabled={isLoading}
                      required
                      title="Enter country code + number (digits only, no '+')"
                      placeholder="919999999999"
                    />
                  </div>
                  {profile?.phoneVerified === false ? (
                    <p className="text-xs text-amber-600">
                      Phone not verified — a verification prompt will appear shortly.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">MALE</SelectItem>
                      <SelectItem value="Female">FEMALE</SelectItem>
                      <SelectItem value="Others">OTHERS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: "#10b981" }} />
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="pl-9" maxLength={100} disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: "#10b981" }} />
                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="pl-9" maxLength={100} disabled={isLoading} />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading || isSavingPersonal} className="w-full" style={{ backgroundColor: "#610981", color: "white" }}>
                  {isSavingPersonal ? "Saving..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Current Level</Label>
                  <Select value={currentLevel} onValueChange={setCurrentLevel} disabled={isLoading}>
                    <SelectTrigger id="level" className="w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
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

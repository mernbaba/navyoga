import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Building2, User } from "lucide-react";
import { toast } from "sonner";
import { PasswordChangeCard } from "../../components/settings/PasswordChangeCard";
import { PHONE_PATTERN, PHONE_TITLE, PHONE_MIN_LENGTH, PHONE_MAX_LENGTH, sanitizePhone } from "../../lib/phone";
import { getMe, patchMe } from "../../api/auth";
import { getPlatform, updatePlatform } from "../../api/platform";
import { setCachedUser } from "../../lib/session";
import type { BusinessSettings, SuperAdminUser } from "../../api/types";

export function Settings() {
  const [profile, setProfile] = useState<SuperAdminUser | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [platform, setPlatform] = useState<BusinessSettings | null>(null);
  const [centerName, setCenterName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstPercentage, setGstPercentage] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currency, setCurrency] = useState("");
  const [language, setLanguage] = useState("");
  const [isPlatformLoading, setIsPlatformLoading] = useState(true);
  const [isPlatformSaving, setIsPlatformSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe("SUPERADMIN")
      .then((fresh) => {
        if (cancelled) return;
        setProfile(fresh);
        setProfileName(fresh.name);
        setProfileEmail(fresh.email);
        setProfilePhone(fresh.phone);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          toast.error(
            err instanceof Error ? err.message : "Failed to load profile.",
          );
      })
      .finally(() => !cancelled && setIsProfileLoading(false));

    getPlatform()
      .then((fresh) => {
        if (cancelled) return;
        setPlatform(fresh);
        setCenterName(fresh.centerName);
        setBusinessEmail(fresh.email);
        setBusinessPhone(fresh.phone);
        setAddress(fresh.address);
        setGstPercentage(String(fresh.gstPercentage));
        setTimezone(fresh.timezone);
        setCurrency(fresh.currency);
        setLanguage(fresh.language);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to load business settings.",
          );
      })
      .finally(() => !cancelled && setIsPlatformLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProfileSaving) return;
    setIsProfileSaving(true);
    try {
      const updated = await patchMe("SUPERADMIN", {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
      });
      setProfile(updated);
      setCachedUser("SUPERADMIN", updated);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSavePlatform = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (isPlatformSaving) return;

    const gstValue = Number(gstPercentage);
    if (Number.isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
      toast.error("GST percentage must be a number between 0 and 100.");
      return;
    }

    setIsPlatformSaving(true);
    try {
      const updated = await updatePlatform({
        centerName,
        email: businessEmail,
        phone: businessPhone,
        address,
        gstPercentage: gstValue,
        timezone,
        currency,
        language,
      });
      setPlatform(updated);
      toast.success("Business settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings.",
      );
    } finally {
      setIsPlatformSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your yoga center configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>My Profile</CardTitle>
            </div>
            <CardDescription>Update your SuperAdmin profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="profileName">Name</Label>
                <Input
                  id="profileName"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  disabled={isProfileLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profileEmail">Email</Label>
                <Input
                  id="profileEmail"
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  disabled={isProfileLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profilePhone">Phone</Label>
                <Input
                  id="profilePhone"
                  type="tel"
                  inputMode="numeric"
                  pattern={PHONE_PATTERN}
                  title={PHONE_TITLE}
                  minLength={PHONE_MIN_LENGTH}
                  maxLength={PHONE_MAX_LENGTH}
                  value={profilePhone}
                  onChange={(event) => setProfilePhone(sanitizePhone(event.target.value))}
                  disabled={isProfileLoading}
                  required
                />
              </div>
              {profile && (
                <p className="text-xs text-muted-foreground">
                  Account created{" "}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              )}
              <Button
                type="submit"
                disabled={isProfileLoading || isProfileSaving}
              >
                {isProfileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PasswordChangeCard role="SUPERADMIN" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <CardTitle>Business Information</CardTitle>
          </div>
          <CardDescription>Update your yoga center details</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSavePlatform}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="centerName">Center Name</Label>
              <Input
                id="centerName"
                value={centerName}
                onChange={(event) => setCenterName(event.target.value)}
                disabled={isPlatformLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessEmail">Email Address</Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(event) => setBusinessEmail(event.target.value)}
                disabled={isPlatformLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessPhone">Phone Number</Label>
              <Input
                id="businessPhone"
                type="tel"
                inputMode="numeric"
                pattern={PHONE_PATTERN}
                title={PHONE_TITLE}
                minLength={PHONE_MIN_LENGTH}
                maxLength={PHONE_MAX_LENGTH}
                value={businessPhone}
                onChange={(event) => setBusinessPhone(sanitizePhone(event.target.value))}
                disabled={isPlatformLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={isPlatformLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
              <Input
                id="gstPercentage"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={gstPercentage}
                onChange={(event) => setGstPercentage(event.target.value)}
                disabled={isPlatformLoading}
              />
              <p className="text-xs text-muted-foreground">
                Applied to all purchases. Prices are GST-exclusive; this rate is
                added on top at checkout.
              </p>
            </div>
           {/* <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                disabled={isPlatformLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                disabled={isPlatformLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                disabled={isPlatformLoading}
              />
            </div>*/}
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={isPlatformLoading || isPlatformSaving}
              >
                {isPlatformSaving ? "Saving..." : "Save Business Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

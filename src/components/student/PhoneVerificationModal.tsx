import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Phone, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../ui/input-otp";
import { sendOtp, retryOtp, verifyOtp } from "../../lib/msg91Otp";
import { verifyStudentPhone, patchMe } from "../../api/auth";
import { setCachedUser } from "../../lib/session";
import type { StudentUser } from "../../api/types";

interface Props {
  user: StudentUser | null;
  setUser: (user: StudentUser) => void;
}

export function PhoneVerificationModal({ user, setUser }: Props) {
  const open =
    user !== null && user.phoneVerified === false && user.termsAcceptedAt !== null;

  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [editing, setEditing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [localDigits, setLocalDigits] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const sentForPhone = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    if (sentForPhone.current === user.phone) return;
    sentForPhone.current = user.phone;
    setOtp("");
    setResendIn(0);
    setEditing(false);
    setOtpSent(false);
  }, [open, user]);

  const handleSendOtp = async () => {
    if (!user || sending) return;
    setSending(true);
    try {
      await sendOtp(user.phone);
      toast.success(`OTP sent via SMS to +${user.phone}`);
      setOtpSent(true);
      setResendIn(30);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleResend = async () => {
    if (!user || resendIn > 0 || retrying) return;
    setRetrying(true);
    try {
      await retryOtp();
      toast.success(`New OTP sent via SMS to +${user.phone}`);
      setResendIn(30);
      setOtp("");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Failed to resend OTP.";
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  };

  const handleVerify = async () => {
    if (!user || otp.length !== 4 || verifying) return;
    setVerifying(true);
    try {
      const accessToken = await verifyOtp(otp);
      const updated = await verifyStudentPhone(accessToken);
      setCachedUser("STUDENT", updated);
      setUser(updated);
      toast.success("Phone verified!");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Invalid OTP. Please try again.";
      toast.error(msg);
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  const openEditor = () => {
    if (!user) return;
    const phone = user.phone;
    if (phone.length > 10) {
      setCountryCode(phone.slice(0, phone.length - 10));
      setLocalDigits(phone.slice(-10));
    } else {
      setCountryCode("91");
      setLocalDigits(phone);
    }
    setEditing(true);
  };

  const handleSavePhone = async () => {
    if (!user || savingPhone) return;
    const cc = countryCode.replace(/\D/g, "");
    const local = localDigits.replace(/\D/g, "");
    if (!cc || !local) {
      toast.error("Enter your country code and phone number.");
      return;
    }
    const canonical = `${cc}${local}`;
    if (canonical.length < 8 || canonical.length > 15) {
      toast.error("Phone must be 8-15 digits including country code.");
      return;
    }
    if (canonical === user.phone) {
      setEditing(false);
      sentForPhone.current = null;
      setOtpSent(false);
      setUser({ ...user });
      return;
    }
    setSavingPhone(true);
    try {
      const updated = await patchMe("STUDENT", { phone: canonical });
      setCachedUser("STUDENT", updated);
      setEditing(false);
      sentForPhone.current = null;
      setOtpSent(false);
      setUser(updated);
      toast.success("Phone updated. Tap Continue to receive a fresh OTP.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update phone.";
      toast.error(msg);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-8 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="phone-verify-description"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#ff691d] to-[#ffac96] shadow-lg">
              <Phone className="h-8 w-8 text-white" />
            </div>

            <DialogPrimitive.Title className="text-xl font-semibold text-gray-900">
              Verify your phone number
            </DialogPrimitive.Title>

            {editing ? (
              <div className="w-full space-y-4 text-left">
                <p id="phone-verify-description" className="text-sm text-muted-foreground text-center">
                  Enter your full phone number with country code.
                </p>
                <div className="flex gap-2">
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium">+</span>
                    <Input
                      inputMode="numeric"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="91"
                      aria-label="Country code"
                      className="h-12 pl-7 pr-2 rounded-xl"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="new-phone" className="sr-only">Phone number</Label>
                    <Input
                      id="new-phone"
                      inputMode="numeric"
                      value={localDigits}
                      onChange={(e) => setLocalDigits(e.target.value.replace(/\D/g, "").slice(0, 14))}
                      placeholder="9999999999"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setEditing(false)}
                    disabled={savingPhone}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-[#610981] hover:bg-[#8b0fa8] text-white rounded-xl"
                    onClick={handleSavePhone}
                    disabled={savingPhone}
                  >
                    {savingPhone ? "Saving…" : "Save & send OTP"}
                  </Button>
                </div>
              </div>
            ) : !otpSent ? (
              <>
                <p id="phone-verify-description" className="text-sm text-muted-foreground leading-relaxed">
                  You need to verify your phone number to continue. We'll send a 4-digit code via SMS to{" "}
                  <span className="font-semibold text-[#610981]">+{user?.phone}</span>.
                </p>

                <Button
                  className="mt-2 w-full bg-[#ff691d] hover:bg-[#e85a0f] text-white font-semibold py-3 text-base rounded-xl shadow-md transition-all"
                  onClick={handleSendOtp}
                  disabled={sending}
                >
                  {sending ? "Sending OTP…" : "Continue"}
                </Button>

                <button
                  type="button"
                  onClick={openEditor}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#610981] hover:underline"
                >
                  <Pencil className="w-3 h-3" />
                  Wrong number? Edit phone
                </button>
              </>
            ) : (
              <>
                <p id="phone-verify-description" className="text-sm text-muted-foreground leading-relaxed">
                  We sent a 4-digit code via SMS to{" "}
                  <span className="font-semibold text-[#610981]">+{user?.phone}</span>.
                  Enter it below to continue.
                </p>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={otp}
                    onChange={setOtp}
                    disabled={verifying || sending}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="mt-2 w-full bg-[#ff691d] hover:bg-[#e85a0f] text-white font-semibold py-3 text-base rounded-xl shadow-md transition-all"
                  onClick={handleVerify}
                  disabled={verifying || sending || otp.length !== 4}
                >
                  {verifying ? "Verifying…" : "Verify"}
                </Button>

                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendIn > 0 || retrying || sending}
                    className="text-sm font-medium text-[#610981] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {retrying
                      ? "Resending…"
                      : resendIn > 0
                      ? `Resend OTP in ${resendIn}s`
                      : "Didn't get the code? Resend"}
                  </button>
                  <button
                    type="button"
                    onClick={openEditor}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#610981] hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    Wrong number? Edit phone
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

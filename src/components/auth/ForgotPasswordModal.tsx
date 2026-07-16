import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../ui/input-otp";
// MSG91 widget OTP — replaced by AiSensy WhatsApp OTP (BE-driven).
// import { sendOtp, retryOtp, verifyOtp } from "../../lib/msg91Otp";
import { sendStudentOtp, verifyStudentOtp, forgotPasswordStudent } from "../../api/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "reset";

export function ForgotPasswordModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("91");
  const [localDigits, setLocalDigits] = useState("");
  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [sending, setSending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Reset all state whenever the modal is reopened.
  useEffect(() => {
    if (!open) return;
    setStep("phone");
    setCountryCode("91");
    setLocalDigits("");
    setPhone("");
    setOtp("");
    setNewPassword("");
    setShowPassword(false);
    setResendIn(0);
  }, [open]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSendOtp = async () => {
    if (sending) return;
    const cc = countryCode.replace(/\D/g, "");
    const local = localDigits.replace(/\D/g, "");
    const canonical = `${cc}${local}`;
    if (canonical.length < 8 || canonical.length > 15) {
      toast.error("Enter a valid phone number with country code.");
      return;
    }
    setSending(true);
    try {
      // await sendOtp(canonical);
      await sendStudentOtp(canonical, "PASSWORD_RESET");
      setPhone(canonical);
      toast.success(`OTP sent on WhatsApp to +${canonical}`);
      setStep("reset");
      setResendIn(30);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || retrying) return;
    setRetrying(true);
    try {
      // await retryOtp();
      // AiSensy has no separate retry — resending is just another send, and the
      // BE invalidates the previous code so only the newest one works.
      await sendStudentOtp(phone, "PASSWORD_RESET");
      toast.success(`New OTP sent on WhatsApp to +${phone}`);
      setResendIn(30);
      setOtp("");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Failed to resend OTP.";
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  };

  const handleReset = async () => {
    if (submitting) return;
    if (otp.length !== 4) {
      toast.error("Enter the 4-digit code.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      // const accessToken = await verifyOtp(otp);
      const accessToken = await verifyStudentOtp(phone, "PASSWORD_RESET", otp);
      await forgotPasswordStudent(phone, accessToken, newPassword);
      toast.success("Password reset successful. You can now sign in.");
      onClose();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Couldn't reset password. Please try again.";
      toast.error(msg);
      setOtp("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-8 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          aria-describedby="forgot-password-description"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff691d] to-[#ffac96] shadow-lg">
              <KeyRound className="h-8 w-8 text-white" />
            </div>

            <DialogPrimitive.Title className="text-xl font-semibold text-gray-900">
              Reset your password
            </DialogPrimitive.Title>

            {step === "phone" ? (
              <div className="w-full space-y-4 text-left">
                <p id="forgot-password-description" className="text-sm text-muted-foreground text-center">
                  Enter your registered phone number. We'll send a 4-digit code on WhatsApp to verify it's you.
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
                    <Label htmlFor="reset-phone" className="sr-only">Phone number</Label>
                    <Input
                      id="reset-phone"
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
                    onClick={onClose}
                    disabled={sending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-[#ff691d] hover:bg-[#e85a0f] text-white rounded-xl"
                    onClick={handleSendOtp}
                    disabled={sending}
                  >
                    {sending ? "Sending OTP…" : "Send code"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 text-left">
                <p id="forgot-password-description" className="text-sm text-muted-foreground text-center">
                  We sent a 4-digit code on WhatsApp to{" "}
                  <span className="font-semibold text-[#610981]">+{phone}</span>.
                  Enter it and choose a new password.
                </p>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={otp}
                    onChange={setOtp}
                    disabled={submitting}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-password" className="text-sm font-medium text-gray-700">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-12 pr-12 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full bg-[#ff691d] hover:bg-[#e85a0f] text-white font-semibold py-3 text-base rounded-xl shadow-md transition-all"
                  onClick={handleReset}
                  disabled={submitting || otp.length !== 4}
                >
                  {submitting ? "Resetting…" : "Reset password"}
                </Button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendIn > 0 || retrying || submitting}
                    className="text-sm font-medium text-[#610981] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {retrying
                      ? "Resending…"
                      : resendIn > 0
                      ? `Resend OTP in ${resendIn}s`
                      : "Didn't get the code? Resend"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

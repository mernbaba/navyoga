import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { registerStudent } from "../../api/auth";
import { setRoleAuth } from "../../lib/auth";

export function UserRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referredByCode, setReferredByCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferredByCode(ref.trim());
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const cc = countryCode.replace(/\D/g, "");
    const localDigits = phone.replace(/\D/g, "");
    if (!cc || !localDigits) {
      toast.error("Enter your country code and phone number.");
      return;
    }
    const canonicalPhone = `${cc}${localDigits}`;
    if (canonicalPhone.length < 8 || canonicalPhone.length > 15) {
      toast.error("Phone number must be 8-15 digits including country code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { user, token } = await registerStudent({
        name: name.trim(),
        email: email.trim(),
        phone: canonicalPhone,
        password,
        referredByCode: referredByCode.trim() || undefined,
      });
      setRoleAuth("STUDENT", token, user);
      toast.success("Welcome to Navyoga!");
      navigate("/user/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-5" style={{ backgroundColor: "#ff691d" }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-3xl opacity-5" style={{ backgroundColor: "#610981" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shadow-[#610981]/30 overflow-hidden">
            <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="Navyoga" className="w-full h-full object-contain p-1.5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-3">Sign Up</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "#610981" }}>
            Join Navyoga
          </h1>
          <p className="text-gray-500">Create your sādhaka account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                placeholder="Arjun Sharma"
                className="h-14 pl-12 pr-4 border-gray-200 rounded-xl text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@navyoga.com"
                className="h-14 pl-12 pr-4 border-gray-200 rounded-xl text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="flex gap-2">
              <div className="relative w-24 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium pointer-events-none z-10">
                  +
                </span>
                <Input
                  id="countryCode"
                  inputMode="numeric"
                  value={countryCode}
                  onChange={(event) =>
                    setCountryCode(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  required
                  placeholder="91"
                  aria-label="Country code"
                  className="h-14 pl-7 pr-2 border-gray-200 rounded-xl text-base"
                />
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, ""))
                  }
                  required
                  minLength={6}
                  maxLength={14}
                  placeholder="9999999999"
                  className="h-14 pl-12 pr-4 border-gray-200 rounded-xl text-base"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              We'll send a one-time SMS to verify this number.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                placeholder="At least 8 characters"
                className="h-14 pl-12 pr-12 border-gray-200 rounded-xl text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referredByCode">Referral code (optional)</Label>
            <Input
              id="referredByCode"
              value={referredByCode}
              onChange={(event) => setReferredByCode(event.target.value)}
              maxLength={50}
              placeholder="ARJU-AB12CD"
              className="h-14 px-4 border-gray-200 rounded-xl text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-base font-semibold rounded-xl group transition-all hover:shadow-lg"
            style={{ backgroundColor: "#ff691d", color: "white" }}
          >
            <span>{isSubmitting ? "Creating account..." : "Create Account"}</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "#610981" }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

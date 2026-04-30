import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, Sparkles, User as UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { registerStudent } from "../../api/auth";
import { setRoleAuth } from "../../lib/auth";

export function UserRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referredByCode, setReferredByCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { user, token } = await registerStudent({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        referredByCode: referredByCode.trim() || undefined,
      });
      setRoleAuth("STUDENT", token, user);
      toast.success("Welcome to NavYoga!");
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ backgroundColor: "#ff691d" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-3">Sign Up</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "#610981" }}>
            Join NavYoga
          </h1>
          <p className="text-gray-500">Create your sādhaka account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                minLength={7}
                maxLength={15}
                placeholder="9999999999"
                className="h-14 pl-12 pr-4 border-gray-200 rounded-xl text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { loginWithRole, setRoleAuth } from "../../lib/auth";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export type LoginRole = "SUPERADMIN" | "TUTOR" | "OPERATIONS" | "FRONTLINE" | "STUDENT";

type LoginPageConfig = {
  roleLabel: string;
  welcomeText: string;
  destination: string;
};

const loginPageConfig: Record<LoginRole, LoginPageConfig> = {
  SUPERADMIN: {
    roleLabel: "Super Admin",
    welcomeText: "Welcome back, Super Admin!",
    destination: "/superadmin/dashboard",
  },
  TUTOR: {
    roleLabel: "Yoga Shikshak",
    welcomeText: "Welcome back, Yoga Shikshak!",
    destination: "/tutor/dashboard",
  },
  OPERATIONS: {
    roleLabel: "Operations",
    welcomeText: "Welcome back, Operations Team!",
    destination: "/operations/dashboard",
  },
  FRONTLINE: {
    roleLabel: "Frontline",
    welcomeText: "Welcome back, Frontline Team!",
    destination: "/frontline/dashboard",
  },
  STUDENT: {
    roleLabel: "Sādhaka",
    welcomeText: "Welcome back, Sādhaka!",
    destination: "/user/dashboard",
  },
};

export function RoleLoginPage({ role }: { role: LoginRole }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const config = loginPageConfig[role];

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, token } = await loginWithRole(role, email.trim(), password);

      setRoleAuth(role, token, user);

      const userName = typeof user.name === "string" ? user.name.trim() : "";
      toast.success(userName ? `Welcome back, ${userName}!` : config.welcomeText);
      navigate(config.destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-100 h-100 rounded-full blur-3xl opacity-5" style={{ backgroundColor: "#ff691d" }} />
      <div className="absolute bottom-0 left-0 w-75 h-75 rounded-full blur-3xl opacity-5" style={{ backgroundColor: "#610981" }} />

      <div className="absolute top-10 right-10 w-2 h-2 rounded-full" style={{ backgroundColor: "#ff691d" }} />
      <div className="absolute bottom-10 left-10 w-2 h-2 rounded-full" style={{ backgroundColor: "#610981" }} />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ffac96" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shadow-[#610981]/30 overflow-hidden">
            <img src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg" alt="Navyoga" className="w-full h-full object-contain p-1.5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-3">{config.roleLabel} Portal</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "#610981" }}>
            Navyoga Wellness
          </h1>
          <p className="text-gray-500">{config.welcomeText}</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleLogin}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" style={{ color: "#ff691d" }} />
              <Input
                id="email"
                type="email"
                placeholder="you@navyoga.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 pl-12 pr-4 border-gray-200 rounded-xl text-base focus:border-[#ff691d] focus:ring-[#ff691d] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" style={{ color: "#610981" }} />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 pl-12 pr-12 border-gray-200 rounded-xl text-base focus:border-[#610981] focus:ring-[#610981] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {role === "STUDENT" && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-sm font-medium hover:underline transition-colors"
                style={{ color: "#ff691d" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-base font-semibold rounded-xl group transition-all duration-300 hover:shadow-lg"
            style={{ backgroundColor: "#ff691d", color: "white" }}
          >
            <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-8"
        >
          {role === "STUDENT" ? (
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: "#610981" }}>
                Sign up
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Need help with access?{" "}
              <a href="mailto:support@navyogaacademy.com" className="font-semibold hover:underline" style={{ color: "#610981" }}>
                Contact support
              </a>
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-12 text-xs text-gray-400"
        >
          © 2026 Navyoga Wellness. All rights reserved.
        </motion.div>
      </motion.div>

      {role === "STUDENT" && (
        <ForgotPasswordModal
          open={forgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
        />
      )}
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { setRoleAuth } from "../../lib/auth";
import { getStudentByToken } from "../../api/auth";

// Hand-off landing for the marketing-site funnel.
//
// The marketing codebase does the whole purchase against the BE on its own —
// account creation, payment, and password setup — and receives the student
// token back. It then sends the buyer here:
//
//   /onboard?token=<token>
//
// All this route does is prove the token is live, adopt it as the student
// session, and drop the buyer into the app. No forms: everything that needed
// input already happened upstream.
//
// The token is checked against the API before anything is written to
// localStorage, so a stale or mangled link never leaves a half-session behind —
// and `navigate(..., { replace: true })` gets the token out of the address bar
// and out of history once it has been consumed.

const DASHBOARD_PATH = "/user/dashboard";

export function Onboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();
  const [error, setError] = useState<string | null>(null);
  // React 19 StrictMode runs effects twice in dev; without this the hand-off
  // fires two /me requests and two toasts for one arrival.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;

    if (!token) {
      setError("This link is missing its access token.");
      return;
    }

    consumed.current = true;
    let cancelled = false;

    getStudentByToken(token)
      .then((student) => {
        if (cancelled) return;
        setRoleAuth("STUDENT", token, student);
        const name = student.name?.trim();
        toast.success(name ? `Welcome, ${name}!` : "Welcome to Navyoga!");
        navigate(DASHBOARD_PATH, { replace: true });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "This link has expired or is no longer valid.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

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
        className="w-full max-w-md relative z-10 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shadow-[#610981]/30 overflow-hidden">
          <img
            src="https://navyoga.in/wp-content/uploads/2024/12/navyoga-light.svg"
            alt="Navyoga"
            className="w-full h-full object-contain p-1.5"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "#610981" }}>
          Navyoga Wellness
        </h1>

        {error === null ? (
          <>
            <p className="text-gray-500">Signing you in…</p>
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-8">We couldn't open this link.</p>
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left mb-6">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#ff691d" }} />
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <Button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full h-14 text-base font-semibold rounded-xl group transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: "#ff691d", color: "white" }}
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-gray-600 mt-6">
              Need a hand?{" "}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: "#610981" }}>
                Sign in with your email
              </Link>
            </p>
          </>
        )}

        <div className="mt-12 text-xs text-gray-400">
          © 2026 Navyoga Wellness. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}

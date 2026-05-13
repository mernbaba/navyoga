import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white flex flex-col items-center justify-center p-6">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
      />

      <div
        className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-[0.08]"
        style={{ backgroundColor: "#ff691d" }}
      />
      <div
        className="pointer-events-none absolute -bottom-44 -left-36 w-[460px] h-[460px] rounded-full blur-3xl opacity-[0.07]"
        style={{ backgroundColor: "#610981" }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#610981 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="pointer-events-none absolute top-10 right-10 w-2 h-2 rounded-full" style={{ backgroundColor: "#ff691d" }} />
      <div className="pointer-events-none absolute bottom-10 left-10 w-2 h-2 rounded-full" style={{ backgroundColor: "#610981" }} />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ffac96" }} />
      <div className="pointer-events-none absolute bottom-1/4 right-1/3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#610981", opacity: 0.4 }} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
        }}
        className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 rounded-full border border-[#610981]/15 bg-[#610981]/5 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#ff691d" }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#610981]">
            NavYoga · Off the path
          </span>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          className="relative flex items-center justify-center select-none"
        >
          <span
            className="text-[170px] sm:text-[230px] leading-none"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              color: "#610981",
              fontWeight: 400,
              letterSpacing: "-0.05em",
            }}
          >
            4
          </span>

          <motion.div
            className="relative mx-1 sm:mx-2"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Enso />
          </motion.div>

          <span
            className="text-[170px] sm:text-[230px] leading-none italic"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              color: "#ff691d",
              fontWeight: 400,
              letterSpacing: "-0.05em",
            }}
          >
            4
          </span>
        </motion.div>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          className="mt-2 text-[28px] sm:text-[38px] leading-tight"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#1a1a2e", fontWeight: 400 }}
        >
          You've wandered <em className="text-[#ff691d]">off the mat.</em>
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="mt-3 max-w-md text-gray-500 text-[15px] leading-relaxed"
        >
          The page you're looking for doesn't exist here. Breathe, return,
          and we'll find a way back to your practice.
        </motion.p>

        {location.pathname && (
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#f8f9fe] border border-[#610981]/10 text-xs text-gray-500 font-mono max-w-full"
          >
            <span className="font-semibold text-[#ff691d]">404</span>
            <span className="opacity-30">|</span>
            <span className="truncate max-w-[280px] sm:max-w-[420px]">{location.pathname}</span>
          </motion.div>
        )}

        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="mt-8 flex flex-col sm:flex-row gap-3 items-center"
        >
          <Button
            type="button"
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-12 px-6 rounded-xl border-gray-200 hover:border-[#610981]/30 hover:bg-[#610981]/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
          <Button
            asChild
            className="h-12 px-6 rounded-xl group transition-all hover:shadow-lg hover:shadow-[#ff691d]/30"
            style={{ backgroundColor: "#ff691d", color: "white" }}
          >
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return home
              <span className="ml-1 inline-block translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-6 text-[10px] sm:text-[11px] uppercase tracking-[0.45em] text-gray-400 font-medium"
      >
        Inhale · Pause · Exhale
      </motion.div>
    </div>
  );
}

function Enso() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-[150px] sm:w-[210px] h-[150px] sm:h-[210px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="enso-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#610981" />
          <stop offset="60%" stopColor="#8b0fa8" />
          <stop offset="100%" stopColor="#ff691d" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="94" fill="none" stroke="#610981" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#ff691d" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 4" />

      <path
        d="M 100 18 A 82 82 0 1 1 28 132"
        fill="none"
        stroke="url(#enso-stroke)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      <g transform="translate(100 100)">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-24"
            rx="6"
            ry="15"
            fill="#ffac96"
            opacity="0.55"
            transform={`rotate(${angle})`}
          />
        ))}
        {[30, 90, 150, 210, 270, 330].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-18"
            rx="4"
            ry="10"
            fill="#ff691d"
            opacity="0.35"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r="6" fill="#ff691d" />
        <circle r="2.5" fill="#fff" />
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 100 100"
          to="360 100 100"
          dur="14s"
          repeatCount="indefinite"
        />
        <circle cx="100" cy="18" r="3" fill="#610981" />
      </g>
    </svg>
  );
}

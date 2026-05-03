import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const MotionLink = motion(Link);

export function NotFound() {
  return (
    <div className="noise mesh-bg mesh-bg-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="mesh-orb" />
      <div className="mesh-orb" />
      <AnimatePresence>
        <motion.div
          key="404"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="glass-card"
          style={{ maxWidth: 520, padding: 40, textAlign: "center" }}
        >
          <motion.svg width="200" height="140" viewBox="0 0 200 140" style={{ margin: "0 auto 16px" }} initial={{ rotate: -4 }} animate={{ rotate: [ -4, 4, -4 ] }} transition={{ repeat: Infinity, duration: 6 }}>
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect x="10" y="20" width="180" height="100" rx="16" fill="rgba(59,130,246,0.08)" stroke="url(#g)" strokeWidth="2" />
            <text x="100" y="88" textAnchor="middle" fill="#f1f5f9" fontSize="42" fontFamily="Syne, sans-serif" fontWeight="800">
              404
            </text>
          </motion.svg>
          <h1 className="display" style={{ margin: "0 0 12px", fontSize: 28 }}>
            Lost in deep space
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>The page you requested is not in this orbit.</p>
          <MotionLink
            to="/"
            className="glass-card btn-shimmer"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(139,92,246,0.25))",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <ArrowLeft size={18} /> Back to Nexus
          </MotionLink>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

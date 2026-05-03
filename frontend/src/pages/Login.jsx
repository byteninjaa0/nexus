import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

const MotionLink = motion(Link);
import toast from "react-hot-toast";
import { loginSchema } from "../utils/schemas.js";
import { authApi } from "../api/endpoints.js";
import { useAuthStore } from "../store/authStore.js";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [shake, setShake] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values) {
    try {
      const { data } = await authApi.login(values);
      setAuth(data);
      toast.success("Welcome back");
      navigate("/app/dashboard");
    } catch (e) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(e.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="noise mesh-bg auth-grid">
      <div className="mesh-orb" />
      <div className="mesh-orb" />
      <div className="mesh-orb" />
      <div className="auth-marketing" style={{ display: "grid", placeItems: "center", padding: 32 }}>
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card"
          style={{ width: "min(420px, 90vw)", padding: 32, transform: "perspective(900px) rotateY(-6deg)" }}
        >
          <div className="display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Nexus Console
          </div>
          <p style={{ color: "var(--text-muted)", marginTop: 0 }}>Glass command preview</p>
          <div style={{ marginTop: 24, height: 4, borderRadius: 4, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
        </motion.div>
      </div>
      <div style={{ display: "grid", placeItems: "center", padding: 32 }}>
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="glass-card"
          style={{ width: "min(440px, 100%)", padding: 32 }}
        >
          <h1 className="display" style={{ marginTop: 0 }}>
            Sign in
          </h1>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Email</span>
            <input
              {...register("email")}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                borderRadius: 12,
                border: errors.email ? "1px solid var(--accent-red)" : "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--text-primary)",
                outline: "none",
                boxShadow: "0 0 0 0 rgba(59,130,246,0)",
              }}
            />
            {errors.email && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "var(--accent-red)", fontSize: 13 }}>
                {errors.email.message}
              </motion.p>
            )}
          </label>
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Password</span>
            <input
              type="password"
              {...register("password")}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                borderRadius: 12,
                border: errors.password ? "1px solid var(--accent-red)" : "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </label>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-shimmer glass-card"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(59,130,246,0.35)",
              background: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(139,92,246,0.35))",
              color: "white",
              fontWeight: 700,
            }}
          >
            {isSubmitting ? "Signing in…" : "Enter Nexus"}
          </motion.button>
          <p style={{ marginTop: 16, color: "var(--text-muted)" }}>
            New here?{" "}
            <MotionLink to="/signup" style={{ color: "var(--accent-cyan)" }} whileHover={{ opacity: 0.9, x: 2 }} whileTap={{ scale: 0.98 }}>
              Create account
            </MotionLink>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

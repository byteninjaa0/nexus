import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { signupSchema } from "../utils/schemas.js";
import { authApi } from "../api/endpoints.js";
import { useAuthStore } from "../store/authStore.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

const MotionLink = motion(Link);

function strength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (/[A-Z]/.test(pw)) s += 25;
  if (/\d/.test(pw)) s += 25;
  if (/[^A-Za-z0-9]/.test(pw)) s += 25;
  return s;
}

export function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [shake, setShake] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const email = watch("email");
  const password = watch("password");
  const debouncedEmail = useDebouncedValue(email, 450);
  const [emailOk, setEmailOk] = useState(null);

  useEffect(() => {
    if (!debouncedEmail || !String(debouncedEmail).includes("@")) {
      setEmailOk(null);
      return;
    }
    authApi
      .checkEmail(debouncedEmail)
      .then((r) => setEmailOk(r.data.available))
      .catch(() => setEmailOk(null));
  }, [debouncedEmail]);

  const pwStrength = useMemo(() => strength(password), [password]);

  async function onSubmit(values) {
    try {
      const { data } = await authApi.signup(values);
      setAuth(data);
      toast.success("Account created");
      navigate("/app/dashboard");
    } catch (e) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(e.response?.data?.error || "Signup failed");
    }
  }

  return (
    <div className="noise mesh-bg auth-grid">
      <div className="mesh-orb" />
      <div className="mesh-orb" />
      <div className="auth-marketing" style={{ display: "grid", placeItems: "center", padding: 32 }}>
        <motion.div
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="glass-card"
          style={{ width: "min(420px, 90vw)", padding: 32, transform: "perspective(900px) rotateY(6deg)" }}
        >
          <div className="display" style={{ fontSize: 22, fontWeight: 800 }}>
            Join the mesh
          </div>
          <p style={{ color: "var(--text-muted)" }}>Realtime tasks, glass UI, electric velocity.</p>
        </motion.div>
      </div>
      <div style={{ display: "grid", placeItems: "center", padding: 32 }}>
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          animate={shake ? { x: [0, -10, 10, 0] } : {}}
          className="glass-card"
          style={{ width: "min(460px, 100%)", padding: 32 }}
        >
          <h1 className="display" style={{ marginTop: 0 }}>
            Create account
          </h1>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Name</span>
            <input
              {...register("name")}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--text-primary)",
              }}
            />
            {errors.name && <p style={{ color: "var(--accent-red)", fontSize: 13 }}>{errors.name.message}</p>}
          </label>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Email</span>
            <input
              {...register("email")}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--text-primary)",
              }}
            />
            {emailOk === false && <p style={{ color: "var(--accent-amber)", fontSize: 13 }}>Email already taken</p>}
            {errors.email && <p style={{ color: "var(--accent-red)", fontSize: 13 }}>{errors.email.message}</p>}
          </label>
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Password</span>
            <input
              type="password"
              {...register("password")}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "var(--text-primary)",
              }}
            />
            <div style={{ height: 8, borderRadius: 8, background: "rgba(255,255,255,0.06)", marginTop: 8, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${pwStrength}%` }}
                style={{
                  height: "100%",
                  borderRadius: 8,
                  background: `linear-gradient(90deg, var(--accent-red), var(--accent-amber), var(--accent-green))`,
                }}
              />
            </div>
            {errors.password && <p style={{ color: "var(--accent-red)", fontSize: 13 }}>{errors.password.message}</p>}
          </label>
          <motion.button
            type="submit"
            disabled={isSubmitting || emailOk === false}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-shimmer glass-card"
            style={{
              width: "100%",
              marginTop: 12,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(59,130,246,0.35)",
              background: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(139,92,246,0.35))",
              color: "white",
              fontWeight: 700,
            }}
          >
            {isSubmitting ? "Creating…" : "Launch account"}
          </motion.button>
          <p style={{ marginTop: 16, color: "var(--text-muted)" }}>
            Have an account?{" "}
            <MotionLink to="/login" style={{ color: "var(--accent-cyan)" }} whileHover={{ opacity: 0.9, x: 2 }} whileTap={{ scale: 0.98 }}>
              Sign in
            </MotionLink>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

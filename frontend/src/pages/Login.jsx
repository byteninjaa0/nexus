import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { loginSchema } from "../utils/schemas.js";
import { authApi } from "../api/endpoints.js";
import { useAuthStore } from "../store/authStore.js";

const MotionLink = motion(Link);

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
    <div className="noise mesh-bg auth-page">
      <div className="auth-page__bg" aria-hidden="true">
        <div className="mesh-orb" />
        <div className="mesh-orb" />
        <div className="mesh-orb" />
      </div>
      <div className="auth-page__inner">
        <div className="auth-marketing" aria-hidden="true">
          <div className="glass-card auth-marketing-inner">
            <div className="display">Nexus Console</div>
            <p>Tasks, teams, and realtime updates in one place.</p>
            <div className="auth-marketing-accent" />
          </div>
        </div>
        <div className="auth-page__form-wrap">
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : {}}
            transition={{ duration: 0.45 }}
            className="glass-card auth-form-card"
          >
            <div className="auth-form-card__brand">Nexus</div>
            <h1 className="auth-form-card__title">Sign in</h1>
            <label className="auth-field">
              <span>Email</span>
              <input
                {...register("email")}
                className={errors.email ? "auth-field-input--error" : ""}
                autoComplete="email"
              />
              {errors.email && (
                <motion.p
                  className="auth-field-msg auth-field-msg--error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.email.message}
                </motion.p>
              )}
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                {...register("password")}
                className={errors.password ? "auth-field-input--error" : ""}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="auth-field-msg auth-field-msg--error">{errors.password.message}</p>
              )}
            </label>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-shimmer glass-card auth-submit"
            >
              {isSubmitting ? "Signing in…" : "Enter Nexus"}
            </motion.button>
            <p className="auth-form-card__footer">
              New here?{" "}
              <MotionLink to="/signup" style={{ color: "var(--accent-cyan)" }} whileHover={{ opacity: 0.9, x: 2 }} whileTap={{ scale: 0.98 }}>
                Create account
              </MotionLink>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

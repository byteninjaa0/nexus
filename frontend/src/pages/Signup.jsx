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
      const { confirmPassword: _omit, ...payload } = values;
      const { data } = await authApi.signup(payload);
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
    <div className="noise mesh-bg auth-page">
      <div className="auth-page__bg" aria-hidden="true">
        <div className="mesh-orb" />
        <div className="mesh-orb" />
      </div>
      <div className="auth-page__inner">
        <div className="auth-marketing" aria-hidden="true">
          <div className="glass-card auth-marketing-inner">
            <div className="display">Join Nexus</div>
            <p>Realtime tasks and collaboration for your team.</p>
          </div>
        </div>
        <div className="auth-page__form-wrap">
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            animate={shake ? { x: [0, -10, 10, 0] } : {}}
            className="glass-card auth-form-card"
          >
            <div className="auth-form-card__brand">Nexus</div>
            <h1 className="auth-form-card__title">Create account</h1>
            <label className="auth-field">
              <span>Name</span>
              <input {...register("name")} autoComplete="name" />
              {errors.name && <p className="auth-field-msg auth-field-msg--error">{errors.name.message}</p>}
            </label>
            <label className="auth-field">
              <span>Email</span>
              <input {...register("email")} autoComplete="email" />
              {emailOk === false && <p className="auth-field-msg auth-field-msg--warn">Email already taken</p>}
              {errors.email && <p className="auth-field-msg auth-field-msg--error">{errors.email.message}</p>}
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input type="password" {...register("password")} autoComplete="new-password" />
              <div className="auth-strength-bar" aria-hidden="true">
                <motion.div
                  animate={{ width: `${pwStrength}%` }}
                  style={{
                    background: `linear-gradient(90deg, var(--accent-red), var(--accent-amber), var(--accent-green))`,
                  }}
                />
              </div>
              {errors.password && <p className="auth-field-msg auth-field-msg--error">{errors.password.message}</p>}
            </label>
            <label className="auth-field">
              <span>Confirm password</span>
              <input type="password" {...register("confirmPassword")} autoComplete="new-password" />
              {errors.confirmPassword && (
                <p className="auth-field-msg auth-field-msg--error">{errors.confirmPassword.message}</p>
              )}
            </label>
            <motion.button
              type="submit"
              disabled={isSubmitting || emailOk === false}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-shimmer glass-card auth-submit"
            >
              {isSubmitting ? "Creating…" : "Launch account"}
            </motion.button>
            <p className="auth-form-card__footer">
              Have an account?{" "}
              <MotionLink to="/login" style={{ color: "var(--accent-cyan)" }} whileHover={{ opacity: 0.9, x: 2 }} whileTap={{ scale: 0.98 }}>
                Sign in
              </MotionLink>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

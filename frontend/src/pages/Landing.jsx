import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useInView } from "framer-motion";
import { ArrowRight, Layers, Orbit, Zap } from "lucide-react";

function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      s: Math.random() * 0.6 + 0.2,
    }));
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.fillStyle = "#050810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const st of stars) {
        const x = st.x * canvas.width;
        const y = (st.y * canvas.height + t * 40 * st.s) % canvas.height;
        ctx.fillStyle = `rgba(226,232,240,${0.15 + st.r * 0.08})`;
        ctx.beginPath();
        ctx.arc(x, y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: -1, opacity: 0.55, pointerEvents: "none" }} />;
}

function TiltCard({ children }) {
  return (
    <motion.div
      style={{ transformStyle: "preserve-3d" }}
      whileHover={{ rotateX: 4, rotateY: -4, y: -6, boxShadow: "0 20px 60px rgba(59,130,246,0.2)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      whileTap={{ scale: 0.99 }}
      className="glass-card"
    >
      {children}
    </motion.div>
  );
}

function AnimatedStat({ value, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const spring = useSpring(0, { stiffness: 90, damping: 20 });
  const [display, setDisplay] = useState(0);
  useMotionValueEvent(spring, "change", (v) => setDisplay(Math.round(v)));
  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);
  return (
    <motion.div
      ref={ref}
      className="glass-card"
      style={{ padding: 20, textAlign: "center" }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
    >
      <div className="display" style={{ fontSize: 36, fontWeight: 800, color: "#e2e8f0" }}>
        {display.toLocaleString()}
      </div>
      <div style={{ color: "var(--text-muted)", marginTop: 6 }}>{label}</div>
    </motion.div>
  );
}

const MotionLink = motion(Link);

export function Landing() {
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroLocal } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.45], [0, -120]);
  const heroSlow = useTransform(scrollYProgress, [0, 0.45], [0, -55]);
  const subY = useTransform(scrollYProgress, [0, 0.45], [0, -40]);
  const orbY = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const orbScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.08]);
  const headerY = useTransform(scrollYProgress, [0, 0.2], [0, -18]);
  const headerTint = useTransform(scrollYProgress, [0, 0.15], ["rgba(5,8,16,0.2)", "rgba(5,8,16,0.82)"]);

  const { scrollYProgress: featP } = useScroll({
    target: featuresRef,
    offset: ["start 0.9", "start 0.25"],
  });
  const featY = useTransform(featP, [0, 1], [56, 0]);
  const featOpacity = useTransform(featP, [0, 1], [0.35, 1]);

  const { scrollYProgress: statsP } = useScroll({
    target: statsRef,
    offset: ["start 0.85", "center center"],
  });
  const statsScale = useTransform(statsP, [0, 1], [0.92, 1]);
  const statsOpacity = useTransform(statsP, [0, 1], [0.5, 1]);

  const title = "NEXUS".split("");
  const heroHeadlineY = useTransform(heroLocal, [0, 1], [0, -48]);

  return (
    <div className="noise" style={{ background: "var(--bg-base)", overflowX: "hidden" }}>
      <Starfield />
      <div className="mesh-bg" style={{ position: "absolute", inset: 0, zIndex: -2 }}>
        <motion.div style={{ y: orbY, scale: orbScale }}>
          <div className="mesh-orb" />
          <div className="mesh-orb" />
          <div className="mesh-orb" />
          <div className="mesh-orb" />
          <div className="mesh-orb" />
        </motion.div>
      </div>

      <motion.header
        style={{
          y: headerY,
          backgroundColor: headerTint,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 8%",
          position: "sticky",
          top: 0,
          zIndex: 20,
          margin: "0 0 8px",
          borderRadius: "0 0 18px 18px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderTop: "none",
        }}
        className="glass-card"
      >
        <div className="display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em" }}>
          <span style={{ background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", color: "transparent" }}>
            Nexus
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <MotionLink
            to="/login"
            className="glass-card"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 16px", borderRadius: 12, color: "var(--text-muted)", display: "inline-block" }}
          >
            Login
          </MotionLink>
          <MotionLink
            to="/signup"
            className="glass-card btn-shimmer"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(139,92,246,0.35))",
              border: "1px solid rgba(255,255,255,0.12)",
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            Get started
          </MotionLink>
        </div>
      </motion.header>

      <section ref={heroRef} style={{ minHeight: "92vh", display: "grid", alignItems: "center", padding: "0 8% 80px" }}>
        <div>
          <motion.div
            style={{ y: heroY, fontSize: "clamp(42px, 8vw, 84px)", fontWeight: 800, lineHeight: 1.02 }}
            className="display"
          >
            <motion.span style={{ display: "inline-block", y: heroHeadlineY }}>
              {title.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5, ease: "easeOut" }}
                  style={{ display: "inline-block", marginRight: 6 }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.span>
          </motion.div>
          <motion.p
            style={{ y: subY, maxWidth: 560, color: "var(--text-muted)", fontSize: 18, lineHeight: 1.6 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            A production-grade glassmorphism command center for projects, tasks, and realtime collaboration — electric blue
            energy included.
          </motion.p>
          <motion.div
            style={{ y: heroSlow, marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <MotionLink
              to="/signup"
              className="glass-card btn-shimmer"
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 22px",
                borderRadius: 14,
                fontWeight: 700,
                border: "1px solid rgba(59,130,246,0.35)",
                background: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(139,92,246,0.35))",
              }}
            >
              Launch console <ArrowRight size={18} />
            </MotionLink>
            <motion.a
              href="#features"
              className="glass-card"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: "14px 22px", borderRadius: 14, color: "var(--text-muted)", display: "inline-flex", alignItems: "center" }}
            >
              Explore features
            </motion.a>
          </motion.div>
        </div>
      </section>

      <motion.section
        ref={featuresRef}
        id="features"
        style={{
          y: featY,
          opacity: featOpacity,
          padding: "80px 8%",
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        }}
      >
        <TiltCard>
          <div style={{ padding: 22 }}>
            <Zap color="#3b82f6" />
            <h3 className="display" style={{ marginBottom: 8 }}>
              Realtime mesh
            </h3>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Socket.io rooms per project — tasks glide across the board for your whole crew.</p>
          </div>
        </TiltCard>
        <TiltCard>
          <div style={{ padding: 22 }}>
            <Layers color="#8b5cf6" />
            <h3 className="display" style={{ marginBottom: 8 }}>
              RBAC depth
            </h3>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Global admins, project owners, and crisp task permissions — security first.</p>
          </div>
        </TiltCard>
        <TiltCard>
          <div style={{ padding: 22 }}>
            <Orbit color="#06b6d4" />
            <h3 className="display" style={{ marginBottom: 8 }}>
              Motion native
            </h3>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Framer Motion everywhere — page transitions, drawers, counters, and delight.</p>
          </div>
        </TiltCard>
      </motion.section>

      <motion.section
        ref={statsRef}
        style={{
          scale: statsScale,
          opacity: statsOpacity,
          padding: "40px 8% 100px",
          transformOrigin: "50% 0%",
        }}
      >
        <motion.h2 className="display" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: 32, marginBottom: 24 }}>
          Trusted velocity
        </motion.h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          <AnimatedStat value={12847} label="Tasks orchestrated" />
          <AnimatedStat value={1844} label="Projects launched" />
          <AnimatedStat value={512} label="Teams synced live" />
        </div>
      </motion.section>

      <section style={{ padding: "0 0 80px", overflow: "hidden" }}>
        <div className="glass-card" style={{ padding: "18px 0", borderLeft: "none", borderRight: "none", borderRadius: 0 }}>
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            style={{ display: "flex", gap: 48, whiteSpace: "nowrap", width: "max-content" }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} style={{ color: "var(--text-muted)" }}>
                “Nexus feels like mission control for our product org.” — Nova Labs
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <footer style={{ padding: "40px 8%", color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        © {new Date().getFullYear()} Nexus — Built for Railway, Docker, and teams who ship.
      </footer>
    </div>
  );
}

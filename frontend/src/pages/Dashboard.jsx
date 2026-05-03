import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { GlassCard } from "../components/ui/GlassCard.jsx";
import { CardSkeleton } from "../components/ui/Skeleton.jsx";
import { MotionCount } from "../components/MotionCount.jsx";
import { staggerContainer, staggerItem } from "../components/PageTransition.jsx";
import { dashboardApi } from "../api/endpoints.js";
import { useAuthStore } from "../store/authStore.js";

const COLORS = {
  TODO: "#64748b",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW: "#8b5cf6",
  DONE: "#10b981",
};

const listParent = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const listItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
};

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, a, o] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.activity(),
          dashboardApi.overdue(),
        ]);
        if (!alive) return;
        setStats(s.data);
        setActivity(a.data.items || []);
        setOverdue(o.data.items || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const emoji = h < 12 ? "🌅" : h < 18 ? "☀️" : "✦";
    const text = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return { text, emoji };
  }, []);

  const pieData = useMemo(() => {
    if (!stats?.statusBreakdown) return [];
    return stats.statusBreakdown.map((r) => ({
      name: r.status.replaceAll("_", " "),
      status: r.status,
      value: r.count,
    }));
  }, [stats]);

  if (loading) {
    return (
      <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: "grid", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div key={i} variants={staggerItem} style={{ gridColumn: i === 0 ? "span 2" : undefined }}>
            <CardSkeleton />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <motion.div variants={staggerItem}>
        <h1 className="display" style={{ margin: 0, fontSize: 34 }}>
          {greeting.text}, {user?.name?.split(" ")[0]} {greeting.emoji}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 6 }}>Your command surface is synced and pulsing.</p>
      </motion.div>

      <motion.div variants={staggerItem} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        {[
          { label: "Total projects", value: stats?.totalProjects ?? 0, accent: "#3b82f6" },
          { label: "Tasks today", value: stats?.tasksToday ?? 0, accent: "#06b6d4" },
          { label: "Overdue", value: stats?.overdue ?? 0, accent: "#f59e0b" },
          { label: "Completed", value: stats?.completed ?? 0, accent: "#10b981" },
        ].map((c) => (
          <GlassCard key={c.label} style={{ padding: 18, borderLeft: `4px solid ${c.accent}`, boxShadow: `0 12px 40px ${c.accent}22` }}>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{c.label}</div>
            <MotionCount
              value={c.value}
              className="display"
              style={{ fontSize: 36, fontWeight: 800, display: "block", marginTop: 4 }}
            />
          </GlassCard>
        ))}
      </motion.div>

      {overdue.length > 0 && (
        <motion.div
          variants={staggerItem}
          animate={{ boxShadow: ["0 0 0 0 rgba(245,158,11,0)", "0 0 0 6px rgba(245,158,11,0.12)", "0 0 0 0 rgba(245,158,11,0)"] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="glass-card"
          style={{ padding: 16, border: "1px solid rgba(245,158,11,0.35)" }}
        >
          <strong style={{ color: "var(--accent-amber)" }}>Overdue radar</strong>
          <motion.ul
            variants={listParent}
            initial="initial"
            animate="animate"
            style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text-muted)", listStyle: "none" }}
          >
            {overdue.slice(0, 5).map((t) => (
              <motion.li key={t.id} variants={listItem} style={{ marginBottom: 8 }}>
                {t.title} · {t.project?.name} · due {t.dueDate ? formatDistanceToNow(new Date(t.dueDate), { addSuffix: true }) : "—"}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}

      <motion.div variants={staggerItem} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <GlassCard hover={false} style={{ padding: 16, minHeight: 320 }}>
          <div style={{ marginBottom: 12, fontWeight: 700 }}>Activity pulse</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats?.activitySeries || []}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)" }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#fill)" strokeWidth={2} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard hover={false} style={{ padding: 16, minHeight: 320 }}>
          <div style={{ marginBottom: 12, fontWeight: 700 }}>Task status</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} isAnimationActive>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status] || "#3b82f6"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)" }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      <motion.div variants={staggerItem} className="glass-card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent activity</div>
        <motion.div variants={listParent} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activity.map((log) => (
            <motion.div key={log.id} variants={listItem} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }} />
              <div>
                <div style={{ fontWeight: 600 }}>{log.action}</div>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {log.entityType} · {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

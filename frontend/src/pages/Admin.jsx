import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { adminApi, usersApi } from "../api/endpoints.js";
import { GlassCard } from "../components/ui/GlassCard.jsx";
import { MotionCount } from "../components/MotionCount.jsx";

const listParent = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};
const listItem = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
};
const statItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
};

export function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, u, a] = await Promise.all([adminApi.stats(), usersApi.list(), adminApi.activity({ limit: 40 })]);
      setStats(s.data);
      setUsers(u.data.items || []);
      setActivity(a.data.items || []);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUserRole(id, role) {
    try {
      await usersApi.update(id, { role });
      toast.success("Role updated");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
    }
  }

  async function deactivate(id, deactivated) {
    try {
      await usersApi.update(id, { deactivated });
      toast.success(deactivated ? "Deactivated" : "Activated");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
    }
  }

  if (loading) {
    return <div className="skeleton glass-card" style={{ height: 360 }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="display" style={{ margin: 0, fontSize: 32 }}>
        Admin constellation
      </h1>
      <motion.div variants={listParent} initial="initial" animate="animate" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        {[
          { label: "Users", value: stats?.users },
          { label: "Projects", value: stats?.projects },
          { label: "Tasks", value: stats?.tasks },
          { label: "Active (7d)", value: stats?.activeUsersLast7d },
        ].map((c) => (
          <motion.div key={c.label} variants={statItem}>
            <GlassCard style={{ padding: 16 }}>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{c.label}</div>
              <div className="display" style={{ fontSize: 30, fontWeight: 800 }}>
                {typeof c.value === "number" ? <MotionCount value={c.value} /> : "—"}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <GlassCard hover={false} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, fontWeight: 700 }}>Users</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "rgba(255,255,255,0.03)" }}>
            <tr>
              {["Name", "Email", "Role", "Joined", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: 12, color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody variants={listParent} initial="initial" animate="animate">
            {users.map((u) => (
              <motion.tr key={u.id} variants={listItem} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: 12 }} className="mono">
                  {u.email}
                </td>
                <td style={{ padding: 12 }}>
                  <select
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value)}
                    style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 6 }}
                  >
                    <option>ADMIN</option>
                    <option>MEMBER</option>
                  </select>
                </td>
                <td style={{ padding: 12 }} className="mono">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: 12 }}>{u.deactivated ? "Inactive" : "Active"}</td>
                <td style={{ padding: 12 }}>
                  <motion.button
                    type="button"
                    className="glass-card"
                    style={{ padding: "6px 10px", borderRadius: 8 }}
                    onClick={() => deactivate(u.id, !u.deactivated)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {u.deactivated ? "Activate" : "Deactivate"}
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </GlassCard>

      <GlassCard style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Platform activity</div>
        <motion.div variants={listParent} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflow: "auto" }} className="scrollbar-thin">
          {activity.map((log) => (
            <motion.div key={log.id} variants={listItem} className="mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{log.action}</strong> · {log.entityType} · {new Date(log.createdAt).toLocaleString()} · {log.user?.email}
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </div>
  );
}

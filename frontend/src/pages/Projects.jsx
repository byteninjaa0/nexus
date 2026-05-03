import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutGrid, List, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { GlassCard } from "../components/ui/GlassCard.jsx";
import { CardSkeleton } from "../components/ui/Skeleton.jsx";
import { projectsApi } from "../api/endpoints.js";
import { projectSchema } from "../utils/schemas.js";

const gridList = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};
const gridItem = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 28 } },
};

export function Projects() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [drawer, setDrawer] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "", color: "#3b82f6", icon: "folder", deadline: "", memberIds: [] },
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await projectsApi.list();
      setItems(data.items || []);
    } catch {
      toast.error("Could not load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(values) {
    try {
      await projectsApi.create({
        ...values,
        deadline: values.deadline || undefined,
        memberIds: values.memberIds || [],
      });
      toast.success("Project created");
      reset();
      setDrawer(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
    }
  }

  const sorted = useMemo(() => items, [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <motion.h1 className="display" layout style={{ margin: 0, fontSize: 32, position: "relative" }}>
          Projects
          <motion.span layoutId="proj-line" style={{ display: "block", height: 3, marginTop: 8, borderRadius: 3, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} />
        </motion.h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="glass-card" style={{ display: "flex", padding: 4, borderRadius: 12 }}>
            <motion.button
              type="button"
              onClick={() => setView("grid")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              style={{
                border: "none",
                background: view === "grid" ? "rgba(59,130,246,0.2)" : "transparent",
                color: "var(--text-primary)",
                padding: 8,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              <LayoutGrid size={18} />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setView("list")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              style={{
                border: "none",
                background: view === "list" ? "rgba(59,130,246,0.2)" : "transparent",
                color: "var(--text-primary)",
                padding: 8,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              <List size={18} />
            </motion.button>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setDrawer(true)}
            className="glass-card btn-shimmer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid rgba(59,130,246,0.35)",
              background: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(139,92,246,0.35))",
              fontWeight: 700,
            }}
          >
            <Plus size={18} /> New project
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <GlassCard style={{ padding: 40, textAlign: "center" }}>
          <svg width="120" height="100" viewBox="0 0 120 100" style={{ margin: "0 auto 12px" }}>
            <rect x="10" y="20" width="100" height="60" rx="12" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.35)" />
            <circle cx="40" cy="50" r="8" fill="#8b5cf6" />
            <circle cx="60" cy="50" r="8" fill="#3b82f6" />
          </svg>
          <h3 className="display" style={{ margin: "0 0 8px" }}>
            No projects yet
          </h3>
          <p style={{ color: "var(--text-muted)" }}>Spin up your first command deck — invite your crew after.</p>
          <motion.button type="button" whileTap={{ scale: 0.97 }} className="glass-card" style={{ marginTop: 16, padding: "10px 18px", borderRadius: 12 }} onClick={() => setDrawer(true)}>
            Create project
          </motion.button>
        </GlassCard>
      ) : (
        <motion.div layout variants={gridList} initial="initial" animate="animate" style={{ display: "grid", gap: 14, gridTemplateColumns: view === "grid" ? "repeat(auto-fill,minmax(260px,1fr))" : "1fr" }}>
          {sorted.map((p) => (
            <motion.button
              layout
              key={p.id}
              type="button"
              variants={gridItem}
              onClick={() => navigate(`/app/projects/${p.id}`)}
              className="glass-card"
              whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(59,130,246,0.2)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                textAlign: "left",
                padding: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: `linear-gradient(135deg, rgba(255,255,255,0.03), ${p.color}14)`,
                borderLeft: `4px solid ${p.color || "#3b82f6"}`,
                borderRadius: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div className="display" style={{ fontSize: 20, fontWeight: 800 }}>
                  {p.name}
                </div>
                <span className="mono" style={{ color: "var(--text-muted)" }}>
                  {p.status}
                </span>
              </div>
              <p style={{ color: "var(--text-muted)", minHeight: 40 }}>{p.description || "No description"}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress || 0}%` }} style={{ height: "100%", background: `linear-gradient(90deg, ${p.color}, #8b5cf6)` }} />
                </div>
                <span className="mono" style={{ color: "var(--text-muted)" }}>
                  {p.progress || 0}%
                </span>
              </div>
              <div style={{ marginTop: 12, display: "flex" }}>
                {(p.members || []).slice(0, 4).map((m, idx) => (
                  <img
                    key={m.user.id}
                    src={m.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.email}`}
                    alt=""
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%", marginLeft: idx === 0 ? 0 : -10, border: "2px solid #0d1117" }}
                  />
                ))}
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {drawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.55)", zIndex: 60 }}
            onClick={() => setDrawer(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="glass-card"
              style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(440px, 100%)", padding: 22, overflow: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="display" style={{ marginTop: 0 }}>
                New project
              </h2>
              <form onSubmit={handleSubmit(onCreate)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label>
                  <span className="mono" style={{ color: "var(--text-muted)" }}>
                    Name
                  </span>
                  <input {...register("name")} style={input} />
                </label>
                <label>
                  <span className="mono" style={{ color: "var(--text-muted)" }}>
                    Description
                  </span>
                  <textarea {...register("description")} rows={4} style={{ ...input, resize: "vertical" }} />
                </label>
                <label>
                  <span className="mono" style={{ color: "var(--text-muted)" }}>
                    Accent color
                  </span>
                  <input type="color" {...register("color")} style={{ width: "100%", height: 44, border: "none", background: "transparent" }} />
                </label>
                <label>
                  <span className="mono" style={{ color: "var(--text-muted)" }}>
                    Icon key
                  </span>
                  <input {...register("icon")} style={input} />
                </label>
                <label>
                  <span className="mono" style={{ color: "var(--text-muted)" }}>
                    Deadline
                  </span>
                  <input type="datetime-local" {...register("deadline")} style={input} />
                </label>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="glass-card btn-shimmer"
                  style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(59,130,246,0.35)", fontWeight: 700 }}
                >
                  {isSubmitting ? "Creating…" : "Create"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const input = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text-primary)",
};

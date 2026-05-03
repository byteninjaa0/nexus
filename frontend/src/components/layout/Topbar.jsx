import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Command, Moon, Search, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useUiStore } from "../../store/uiStore.js";
import { notificationsApi, projectsApi } from "../../api/endpoints.js";

const staggerWrap = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
};

function crumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "app") return [{ label: "Nexus", to: "/" }];
  const out = [{ label: "App", to: "/app/dashboard" }];
  if (parts[1] === "dashboard") out.push({ label: "Dashboard", to: "/app/dashboard" });
  if (parts[1] === "projects") {
    out.push({ label: "Projects", to: "/app/projects" });
    if (parts[2]) out.push({ label: "Project", to: pathname });
  }
  if (parts[1] === "admin") out.push({ label: "Admin", to: "/app/admin" });
  return out;
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const trail = useMemo(() => crumbs(location.pathname), [location.pathname]);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const theme = useUiStore((s) => s.theme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    projectsApi
      .list()
      .then((res) => setItems(res.data.items || []))
      .catch(() => setItems([]));
  }, [searchOpen]);

  useEffect(() => {
    notificationsApi
      .list()
      .then((res) => setNotifications(res.data.items || []))
      .catch(() => {});
  }, [notifOpen]);

  const filtered = useMemo(() => {
    const s = dq.toLowerCase().trim();
    if (!s) return items.slice(0, 8);
    return items.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 12);
  }, [items, dq]);

  const unread = notifications.filter((n) => !n.read).length;

  async function markAll() {
    await notificationsApi.readAll();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    toast.success("All read");
  }

  return (
    <header
      className="glass-card"
      style={{
        margin: "16px 28px 0",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderRadius: 16,
      }}
    >
      <nav style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
        {trail.map((c, i) => (
          <span key={c.to} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
            {i > 0 && <span>/</span>}
            <motion.button
              type="button"
              onClick={() => navigate(c.to)}
              whileHover={{ opacity: 0.85 }}
              whileTap={{ scale: 0.97 }}
              style={{
                border: "none",
                background: "none",
                color: i === trail.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {c.label}
            </motion.button>
          </span>
        ))}
      </nav>

      <motion.button
        type="button"
        className="glass-card"
        onClick={() => setSearchOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px",
          borderRadius: 12,
          color: "var(--text-muted)",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <Search size={18} />
        <span style={{ fontSize: 14 }}>Search projects…</span>
        <span className="mono" style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.7 }}>
          <Command size={14} />K
        </span>
      </motion.button>

      <motion.button
        type="button"
        className="glass-card"
        title="Theme"
        onClick={() => useUiStore.setState({ theme: theme === "dark" ? "dim" : "dark" })}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        style={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
      </motion.button>

      <div style={{ position: "relative" }}>
        <motion.button
          type="button"
          className="glass-card"
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setNotifOpen((v) => !v)}
          style={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <Bell size={20} />
          {unread > 0 && (
            <motion.span
              layoutId="notif-badge"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: "var(--accent-blue)",
                color: "white",
                fontSize: 11,
                display: "grid",
                placeItems: "center",
                padding: "0 4px",
                boxShadow: "0 0 16px rgba(59,130,246,0.6)",
              }}
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="glass-card scrollbar-thin"
              style={{
                position: "absolute",
                right: 0,
                top: 52,
                width: 360,
                maxHeight: 420,
                overflow: "auto",
                padding: 12,
                zIndex: 50,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <strong>Notifications</strong>
                <motion.button type="button" className="mono" whileTap={{ scale: 0.96 }} style={{ border: "none", background: "none", color: "var(--accent-cyan)", cursor: "pointer" }} onClick={markAll}>
                  Mark all read
                </motion.button>
              </div>
              {notifications.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>You are all caught up.</p>}
              <motion.div variants={staggerWrap} initial="initial" animate="animate">
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    variants={staggerItem}
                    className="glass-card"
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      borderLeft: n.read ? "3px solid transparent" : "3px solid var(--accent-blue)",
                      fontSize: 14,
                    }}
                  >
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    <div>{n.message}</div>
                    {n.link && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        style={{ marginTop: 8, border: "none", background: "rgba(59,130,246,0.15)", color: "#bfdbfe", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
                        onClick={() => navigate(n.link)}
                      >
                        Open
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5,8,16,0.65)",
              zIndex: 80,
              display: "grid",
              placeItems: "start center",
              paddingTop: "12vh",
            }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="glass-card"
              style={{ width: "min(560px, 92vw)", padding: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter projects…"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--text-primary)",
                  outline: "none",
                  boxShadow: "0 0 0 1px rgba(59,130,246,0.2)",
                }}
              />
              <motion.div variants={staggerWrap} initial="initial" animate="animate" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((p) => (
                  <motion.button
                    key={p.id}
                    type="button"
                    variants={staggerItem}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.06)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/app/projects/${p.id}`);
                    }}
                    className="glass-card"
                    style={{
                      textAlign: "left",
                      padding: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      color: "var(--text-primary)",
                      borderRadius: 12,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ borderLeft: `4px solid ${p.color || "#3b82f6"}`, paddingLeft: 10 }}>{p.name}</span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

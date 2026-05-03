import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import { useUiStore } from "../../store/uiStore.js";
import { authApi } from "../../api/endpoints.js";

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  borderRadius: 12,
  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
  background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
  border: isActive ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
  position: "relative",
  overflow: "hidden",
});

export function Sidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  async function handleLogout() {
    try {
      await authApi.logout({ refreshToken });
    } catch {
      /* ignore */
    }
    logout();
    navigate("/login");
  }

  return (
    <aside
      className="glass-card"
      style={{
        position: "fixed",
        left: 16,
        top: 16,
        bottom: 16,
        width: collapsed ? 56 : 228,
        padding: collapsed ? 12 : 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 40,
        borderRadius: 18,
        transition: "width 0.35s ease, padding 0.35s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          className="display"
          style={{
            fontWeight: 800,
            fontSize: collapsed ? 14 : 22,
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          {collapsed ? "N" : "Nexus"}
        </div>
        {!collapsed && <Sparkles size={18} color="var(--accent-cyan)" />}
      </div>

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="glass-card"
        style={{
          alignSelf: collapsed ? "center" : "flex-end",
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          marginBottom: 8,
        }}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <nav style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <NavLink to="/app/dashboard" style={linkStyle} title="Dashboard">
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/app/projects" style={linkStyle} title="Projects">
          <FolderKanban size={20} />
          {!collapsed && <span>Projects</span>}
        </NavLink>
        {user?.role === "ADMIN" && (
          <NavLink to="/app/admin" style={linkStyle} title="Admin">
            <Shield size={20} />
            {!collapsed && <span>Admin</span>}
          </NavLink>
        )}
      </nav>

      <motion.div
        layout
        className="glass-card"
        style={{
          padding: collapsed ? 8 : 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 14,
        }}
      >
        <img
          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
          alt=""
          width={36}
          height={36}
          style={{ borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)" }}
        />
        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name}
            </div>
            <span className="mono" style={{ color: "var(--accent-cyan)" }}>
              {user?.role}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          style={{
            border: "none",
            background: "rgba(239,68,68,0.12)",
            color: "#fecaca",
            borderRadius: 10,
            padding: 8,
            display: "grid",
            placeItems: "center",
          }}
        >
          <LogOut size={18} />
        </button>
      </motion.div>
    </aside>
  );
}

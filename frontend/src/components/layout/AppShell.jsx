import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { useUiStore } from "../../store/uiStore.js";

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 30 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export function AppShell() {
  const location = useLocation();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => useUiStore.setState({ sidebarCollapsed: mq.matches });
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="noise" style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          marginLeft: sidebarCollapsed ? 88 : 268,
          transition: "margin-left 0.35s ease",
        }}
      >
        <Topbar />
        <main style={{ flex: 1, padding: "24px 28px 40px", position: "relative" }}>
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} style={{ minHeight: "60vh" }} variants={pageMotion} initial="initial" animate="animate" exit="exit">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

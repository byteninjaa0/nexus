import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import { PublicPageMotionLayout } from "./components/layout/PublicPageMotionLayout.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Login } from "./pages/Login.jsx";
import { Signup } from "./pages/Signup.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Projects } from "./pages/Projects.jsx";
import { ProjectDetail } from "./pages/ProjectDetail.jsx";
import { Admin } from "./pages/Admin.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { authApi } from "./api/endpoints.js";

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = useState(() =>
    typeof useAuthStore.persist?.hasHydrated === "function" ? useAuthStore.persist.hasHydrated() : true,
  );

  useEffect(() => {
    const finish = () => setReady(true);
    if (typeof useAuthStore.persist?.hasHydrated === "function" && useAuthStore.persist.hasHydrated()) finish();
    else if (typeof useAuthStore.persist?.onFinishHydration === "function") {
      return useAuthStore.persist.onFinishHydration(finish);
    } else finish();
  }, []);

  if (!ready) {
    return (
      <div className="noise" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="glass-card skeleton" style={{ width: 200, height: 48, borderRadius: 16 }} />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const role = useAuthStore((s) => s.user?.role);
  if (role !== "ADMIN") return <Navigate to="/app/dashboard" replace />;
  return children;
}

export default function App() {
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return;
    authApi
      .me()
      .then((r) => setUser(r.data.user))
      .catch(() => {});
  }, [token, setUser]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicPageMotionLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

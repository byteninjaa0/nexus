import { Component } from "react";
import { motion } from "framer-motion";

export class ErrorBoundary extends Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="noise" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <motion.div
            className="glass-card"
            style={{ maxWidth: 480, padding: 32, textAlign: "center" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="display" style={{ marginTop: 0 }}>
              Signal lost
            </h1>
            <p style={{ color: "var(--text-muted)" }}>{this.state.message}</p>
            <button
              type="button"
              className="glass-card btn-shimmer"
              style={{
                marginTop: 20,
                padding: "12px 20px",
                background: "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(139,92,246,0.25))",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "var(--text-primary)",
              }}
              onClick={() => window.location.reload()}
            >
              Reload Nexus
            </button>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

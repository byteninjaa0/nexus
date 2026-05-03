import { motion } from "framer-motion";

export function GlassCard({ children, className = "", style = {}, hover = true, ...props }) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      style={style}
      whileHover={
        hover
          ? { y: -6, boxShadow: "0 20px 60px rgba(59,130,246,0.2)" }
          : undefined
      }
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

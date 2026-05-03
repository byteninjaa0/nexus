import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from "../PageTransition.jsx";

export function PublicPageMotionLayout() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: "100dvh", width: "100%" }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

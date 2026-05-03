import { useEffect, useState } from "react";
import { useMotionValueEvent, useSpring } from "framer-motion";

/** Count-up with spring physics (dashboard / admin stats). */
export function MotionCount({ value, className, style }) {
  const spring = useSpring(0, { stiffness: 120, damping: 24, mass: 0.8 });
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(spring, "change", (v) => {
    setDisplay(Math.round(v));
  });

  useEffect(() => {
    spring.set(Number(value) || 0);
  }, [value, spring]);

  return (
    <span className={className} style={style}>
      {display.toLocaleString()}
    </span>
  );
}

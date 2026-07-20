"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[90] h-[2px] origin-left bg-gradient-to-r from-[var(--gold)] via-[var(--champagne)] to-[var(--gold)]"
      aria-hidden
    />
  );
}

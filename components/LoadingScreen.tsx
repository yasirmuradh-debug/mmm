"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { brand } from "@/lib/data";

export function LoadingScreen() {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setGone(true), 240);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed inset-0 z-[100] grid place-items-center bg-[var(--background)] grain"
          aria-hidden
        >
          <div className="text-center">
            <motion.div
              initial={{ letterSpacing: "0.6em", opacity: 0 }}
              animate={{ letterSpacing: "0.05em", opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="font-display text-[22vw] md:text-[14vw] leading-none text-[var(--foreground)]"
            >
              {brand.name}
            </motion.div>
            <div className="mt-6 flex items-center justify-center gap-4 text-[var(--muted-foreground)] text-xs uppercase tracking-[0.4em]">
              <span className="tabular-nums text-[var(--gold)]">{String(pct).padStart(3, "0")}%</span>
              <span className="h-px w-32 bg-[var(--line)] relative overflow-hidden">
                <span
                  style={{ width: `${pct}%` }}
                  className="absolute inset-y-0 left-0 bg-[var(--gold)] transition-[width] duration-100"
                />
              </span>
              <span>Loading</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

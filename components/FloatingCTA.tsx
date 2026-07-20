"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Magnetic } from "@/components/Magnetic";

export function FloatingCTA({ onClick }: { onClick: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed right-5 md:right-8 bottom-6 md:bottom-8 z-[70]"
        >
          <Magnetic strength={0.35}>
            <button
              onClick={onClick}
              className="group inline-flex items-center gap-3 pl-5 pr-2 py-2.5 rounded-full bg-[var(--gold)] text-black font-semibold text-[11px] tracking-[0.25em] uppercase whitespace-nowrap shadow-[0_15px_50px_-10px_rgba(212,175,55,0.7)] hover:shadow-[0_20px_70px_-10px_rgba(212,175,55,0.9)] transition-shadow"
            >
              <span className="relative">
                Start Your Project
                <span className="absolute inset-0 rounded-full animate-ping bg-[var(--gold)]/40 pointer-events-none" />
              </span>
              <span className="w-8 h-8 grid place-items-center rounded-full bg-black text-[var(--gold)] group-hover:rotate-12 transition-transform">
                <Sparkles className="w-4 h-4" />
              </span>
            </button>
          </Magnetic>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

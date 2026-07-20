"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 36,
  className = "",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-12% 0px" }}
      transition={{ delay, duration: 0.9, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Big display heading revealed word by word from below a masked line. */
export function RevealHeading({
  lines,
  className = "",
  delay = 0,
  as: Tag = "h2",
}: {
  lines: string[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block will-change-transform"
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ delay: delay + i * 0.12, duration: 0.95, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Section eyebrow label with gold rule. */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={`flex items-center gap-4 mb-6 ${className}`}>
      <span className="h-px w-10 bg-[var(--gold)]/70" />
      <span className="text-[var(--gold)] text-[11px] uppercase tracking-[0.45em]">{children}</span>
    </Reveal>
  );
}

/** Animated counter that counts up when scrolled into view. */
export function Counter({ to, suffix = "", className = "" }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {n}
      {suffix}
    </span>
  );
}

/** Image that reveals with a cinematic clip + scale animation. */
export function ImageReveal({
  src,
  alt,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.15, ease: EASE }}
        className="absolute inset-0"
      >
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          initial={{ scale: 1.25 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.5, ease: EASE }}
          className={`absolute inset-0 w-full h-full object-cover ${imgClassName}`}
        />
      </motion.div>
    </div>
  );
}

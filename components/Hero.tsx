"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { brand, hero } from "@/lib/data";
import { Magnetic } from "@/components/Magnetic";
import { Particles } from "@/components/Particles";
import { AVATAR_SRC, useAvatar } from "@/lib/useAvatar";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function Hero({ onStartProject }: { onStartProject: () => void }) {
  const avatarOk = useAvatar();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const portraitX = useTransform(sx, (v) => v * 28);
  const portraitY = useTransform(sy, (v) => v * 22);
  const portraitRotateY = useTransform(sx, (v) => v * 7);
  const portraitRotateX = useTransform(sy, (v) => v * -5);
  const textX = useTransform(sx, (v) => v * -10);
  const textY = useTransform(sy, (v) => v * -6);
  const glowX = useTransform(sx, (v) => v * 70);
  const glowY = useTransform(sy, (v) => v * 70);

  return (
    <section
      id="home"
      className="relative min-h-[100svh] w-full overflow-hidden grain flex items-center justify-center"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      {/* Ambient gradient + floating gold orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.09),transparent_38%)]" />
      <div className="absolute -left-32 top-1/4 w-[46vmin] h-[46vmin] rounded-full bg-[radial-gradient(circle,rgba(212,180,140,0.14),transparent_60%)] blur-3xl animate-drift" />
      <div
        className="absolute -right-24 bottom-1/4 w-[38vmin] h-[38vmin] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_60%)] blur-3xl animate-drift"
        style={{ animationDelay: "-11s" }}
      />
      <motion.div style={{ x: glowX, y: glowY }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72vmin] h-[72vmin] rounded-full pointer-events-none">
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(212,180,140,0.22),transparent_60%)] blur-2xl" />
      </motion.div>
      <Particles count={22} />

      {/* Giant backdrop word */}
      <div className="absolute inset-0 grid place-items-center overflow-hidden px-[2vw] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 110 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.7, ease: EASE }}
        >
          <motion.h1
            style={{ x: textX, y: textY }}
            className="font-display text-center text-[clamp(5rem,26vw,24rem)] leading-[0.8] text-[var(--foreground)] whitespace-nowrap select-none"
          >
            {hero.backdrop}
          </motion.h1>
        </motion.div>
      </div>

      {/* 3D avatar with mouse-follow parallax */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none" style={{ perspective: 1200 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.15, delay: 1.95, ease: EASE }}
          className="pointer-events-auto"
        >
          <motion.div
            style={{ x: portraitX, y: portraitY, rotateY: portraitRotateY, rotateX: portraitRotateX, transformStyle: "preserve-3d" }}
            whileHover={{ scale: 1.025 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="relative origin-center animate-float"
          >
            <div className="absolute inset-x-[12%] bottom-[2%] h-10 rounded-full bg-black/80 blur-2xl" />
            {avatarOk !== false ? (
              /* The exact 3D avatar from the original site — restored into
                 public/images/avatar.png by scripts/fetch-avatar.mjs */
              <img
                src={AVATAR_SRC}
                alt="Jabeer — 3D avatar portrait"
                style={{ opacity: avatarOk ? 1 : 0 }}
                className="relative block h-[62svh] md:h-[70svh] max-h-[760px] max-w-[82vw] w-auto object-contain select-none drop-shadow-[0_36px_72px_rgba(0,0,0,0.85)] transition-opacity duration-700"
              />
            ) : (
              <div className="relative grid place-items-center h-[52svh] md:h-[60svh] aspect-[3/4]">
                <div className="absolute inset-0 rounded-[3rem] glass-card" />
                <span className="font-display text-[10rem] gold-text leading-none">J</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Intro copy + CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.9, ease: EASE }}
        className="absolute left-6 md:left-12 bottom-8 md:bottom-12 z-20 max-w-xs"
      >
        <div className="text-[var(--foreground)] text-xs uppercase tracking-[0.3em] mb-1.5">{brand.role}</div>
        <div className="text-[var(--muted-foreground)] text-xs uppercase tracking-[0.3em]">{brand.disciplines}</div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Magnetic strength={0.3}>
            <button
              onClick={onStartProject}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[var(--gold)] text-black text-[11px] uppercase tracking-[0.25em] font-semibold shadow-[0_12px_44px_-12px_rgba(212,175,55,0.6)] hover:brightness-110 transition"
            >
              Start Your Project <Sparkles className="w-3.5 h-3.5" />
            </button>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-[var(--line)] glass text-[11px] uppercase tracking-[0.25em] text-[var(--foreground)] hover:border-[var(--gold)] transition"
            >
              View Work
            </a>
          </Magnetic>
        </div>
      </motion.div>

      {/* Right meta + scroll cue */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.7, duration: 0.9, ease: EASE }}
        className="absolute right-6 md:right-12 bottom-8 md:bottom-12 z-20 hidden md:flex flex-col items-end gap-5"
      >
        <div className="text-right text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
          {brand.topbarLeft}
          <div className="text-[var(--gold)] mt-1.5">{brand.location}</div>
        </div>
        <a
          href="#introduction"
          aria-label="Scroll to introduction"
          className="group w-11 h-11 grid place-items-center rounded-full border border-[var(--line)] glass hover:border-[var(--gold)] transition"
        >
          <ArrowDown className="w-4 h-4 animate-bounce group-hover:text-[var(--gold)]" />
        </a>
      </motion.div>
    </section>
  );
}

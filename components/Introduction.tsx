"use client";

import { motion } from "framer-motion";
import { hero } from "@/lib/data";
import { Reveal, RevealHeading, SectionLabel } from "@/components/Reveal";
import { Particles } from "@/components/Particles";
import { AVATAR_SRC, useAvatar } from "@/lib/useAvatar";

export function Introduction() {
  const avatarOk = useAvatar();
  return (
    <section id="introduction" className="relative overflow-hidden grain section-pad">
      <Particles count={14} />
      <div className="container-x grid md:grid-cols-[1fr_1.1fr] gap-14 md:gap-20 items-center">
        <div className="relative order-2 md:order-1">
          <Reveal>
            <div className="relative rounded-[2rem] overflow-hidden glass-card aspect-[4/5] grid place-items-center">
              {avatarOk ? (
                <motion.img
                  src={AVATAR_SRC}
                  alt="Jabeer — Multimedia Specialist"
                  loading="lazy"
                  decoding="async"
                  initial={{ scale: 1.12 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <span className="font-display text-[8rem] gold-text leading-none select-none">J</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/70 via-transparent to-transparent" />
              <div className="absolute left-6 bottom-6 text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
                <span className="text-[var(--gold)]">{hero.founder}</span>
              </div>
            </div>
          </Reveal>
          <div className="absolute -z-10 -left-10 -bottom-10 w-52 h-52 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14),transparent_60%)] blur-2xl" />
        </div>

        <div className="order-1 md:order-2">
          <SectionLabel>{hero.chapter} — Introduction</SectionLabel>
          <RevealHeading
            lines={["INTRO-", "DUCTION"]}
            className="font-display text-[18vw] md:text-[8.5rem] leading-[0.85] mb-10"
          />
          <Reveal delay={0.25}>
            <p className="text-lg md:text-xl leading-relaxed text-[var(--foreground)]/85 max-w-xl">
              {hero.intro}
            </p>
          </Reveal>
          <Reveal delay={0.4} className="mt-8">
            <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] uppercase tracking-[0.3em]">
              <span className="h-px w-12 bg-[var(--gold)]/60" />
              {hero.founder}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/data";
import { Counter, RevealHeading, SectionLabel } from "@/components/Reveal";
import { Particles } from "@/components/Particles";

export function Stats() {
  return (
    <section id="stats" className="relative overflow-hidden grain section-pad bg-[var(--surface)]">
      <Particles count={14} />
      <div className="container-x">
        <SectionLabel>By The Numbers</SectionLabel>
        <RevealHeading
          lines={["RESULTS THAT SPEAK."]}
          className="font-display text-[11vw] md:text-8xl leading-none mb-14 md:mb-20 max-w-5xl"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="rounded-[1.5rem] glass-card p-7 md:p-10 hover:border-[var(--gold)]/50 transition-colors"
            >
              <div className="font-display text-5xl md:text-7xl xl:text-8xl text-[var(--gold)] leading-none">
                <Counter to={s.n} suffix={s.suffix} />
              </div>
              <div className="mt-4 text-[10px] md:text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

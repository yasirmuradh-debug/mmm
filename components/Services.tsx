"use client";

import { motion } from "framer-motion";
import { Camera, Code2, Megaphone, Palette, Sparkles, Video } from "lucide-react";
import { skills, skillsNote } from "@/lib/data";
import { Reveal, RevealHeading, SectionLabel } from "@/components/Reveal";
import { Particles } from "@/components/Particles";

const icons = { Video, Camera, Code2, Megaphone, Sparkles, Palette } as const;

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden grain section-pad bg-[var(--surface)]">
      <Particles count={14} />
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 md:mb-20">
          <div>
            <SectionLabel>Chapter 05 — Skills & Services</SectionLabel>
            <RevealHeading lines={["SKILLS"]} className="font-display text-[16vw] md:text-9xl leading-none" />
          </div>
          <Reveal delay={0.2} className="max-w-xs pb-3">
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{skillsNote}</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
          {skills.map((s, i) => {
            const Icon = icons[s.icon as keyof typeof icons];
            return (
              <motion.article
                key={s.name}
                initial={{ opacity: 0, y: 56 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ delay: (i % 3) * 0.1, duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
                whileHover={{ y: -12 }}
                className="group relative flex flex-col h-full rounded-[1.5rem] glass-card hover:border-[var(--gold)] transition-colors overflow-hidden shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]"
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/30 to-transparent" />
                  <div className="absolute top-4 right-4 text-[10px] tabular-nums text-[var(--muted-foreground)] glass px-2.5 py-1 rounded-full">
                    0{i + 1}
                  </div>
                </div>
                <div className="p-7 md:p-8 flex-1 flex flex-col">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="w-5 h-5 text-[var(--gold)]" />
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl mb-2">{s.name}</h3>
                  <p className="text-sm text-[var(--foreground)]/65 leading-relaxed">{s.desc}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { education } from "@/lib/data";
import { ImageReveal, RevealHeading, SectionLabel } from "@/components/Reveal";
import { Particles } from "@/components/Particles";

export function Education() {
  return (
    <section id="education" className="relative overflow-hidden grain section-pad">
      <Particles count={10} />
      <div className="container-x">
        <SectionLabel>Chapter 04 — Education</SectionLabel>
        <RevealHeading
          lines={["EDUCATION"]}
          className="font-display text-[16vw] md:text-9xl leading-none mb-14 md:mb-20"
        />
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {education.map((e, i) => (
            <motion.article
              key={e.title}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: i * 0.12, duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -10 }}
              className="group relative flex flex-col rounded-[1.5rem] glass-card hover:border-[var(--gold)]/50 transition-colors overflow-hidden"
            >
              <div className="relative w-full aspect-[16/9] overflow-hidden">
                <ImageReveal src={e.img} alt={e.title} className="absolute inset-0" imgClassName="transition-transform duration-[1400ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <GraduationCap className="w-6 h-6 text-[var(--gold)] mb-5" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-3">{e.year}</div>
                <h3 className="font-display text-3xl mb-2">{e.title}</h3>
                <div className="text-sm text-[var(--gold)] mb-4">{e.school}</div>
                <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">{e.note}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

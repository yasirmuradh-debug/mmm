"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { experience } from "@/lib/data";
import { ImageReveal, RevealHeading, SectionLabel } from "@/components/Reveal";

export function Experience() {
  return (
    <section id="experience" className="relative overflow-hidden grain section-pad">
      <div className="container-x">
        <SectionLabel>Chapter 06 — Experience</SectionLabel>
        <RevealHeading
          lines={["EXPERIENCE"]}
          className="font-display text-[15vw] md:text-9xl leading-none mb-14 md:mb-20"
        />
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--gold)]/50 via-[var(--line)] to-transparent hidden md:block" />
          <div className="space-y-14 md:space-y-20">
            {experience.map((e, i) => (
              <motion.div
                key={e.title}
                initial={{ opacity: 0, x: -36 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ delay: i * 0.1, duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative md:pl-20 grid md:grid-cols-[1fr_300px] gap-8 items-start"
              >
                <div className="relative">
                  <div className="hidden md:grid absolute -left-20 top-1 w-9 h-9 rounded-full border border-[var(--gold)] place-items-center bg-[var(--background)]">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--gold)]" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.3em] text-[var(--gold)] mb-3">{e.year}</div>
                  <h3 className="font-display text-4xl md:text-5xl mb-1.5">{e.title}</h3>
                  <div className="text-sm text-[var(--foreground)]/70 mb-4">{e.org}</div>
                  <p className="text-base text-[var(--foreground)]/75 max-w-2xl leading-relaxed">{e.desc}</p>
                </div>
                <ImageReveal
                  src={e.img}
                  alt={e.title}
                  className="w-full aspect-[4/3] rounded-[1.25rem] border border-[var(--line)]"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

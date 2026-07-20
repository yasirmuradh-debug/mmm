"use client";

import { motion } from "framer-motion";
import { Clapperboard, Compass, Eye, Send, Target } from "lucide-react";
import { workflow } from "@/lib/data";
import { RevealHeading, SectionLabel } from "@/components/Reveal";

const icons = { Compass, Target, Clapperboard, Eye, Send } as const;

export function Process() {
  return (
    <section id="process" className="relative overflow-hidden grain section-pad bg-[var(--surface)]">
      <div className="container-x">
        <SectionLabel>Process</SectionLabel>
        <RevealHeading
          lines={["HOW WE WORK"]}
          className="font-display text-[13vw] md:text-9xl leading-none mb-14 md:mb-20"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {workflow.map((w, i) => {
            const Icon = icons[w.icon as keyof typeof icons];
            return (
              <motion.div
                key={w.n}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                whileHover={{ y: -10 }}
                className="group relative rounded-[1.5rem] glass-card p-7 md:p-8 hover:border-[var(--gold)] hover:bg-[var(--gold)]/[0.04] transition-colors overflow-hidden min-h-[240px] flex flex-col"
              >
                <div className="font-display text-6xl md:text-7xl text-[var(--gold)]/25 group-hover:text-[var(--gold)] transition-colors duration-500 mb-5">
                  {w.n}
                </div>
                <Icon className="w-6 h-6 text-[var(--gold)] mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                <h3 className="font-display text-2xl mb-2">{w.title}</h3>
                <p className="text-sm text-[var(--foreground)]/65 leading-relaxed">{w.desc}</p>
                {i < workflow.length - 1 && (
                  <span className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-[var(--gold)]/30" aria-hidden />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

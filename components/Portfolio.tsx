"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { portfolioNote, projects } from "@/lib/data";
import { Reveal, RevealHeading, SectionLabel } from "@/components/Reveal";

const categories = ["All", ...projects.map((p) => p.cat)];

export function Portfolio() {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const visible = projects.filter((p) => filter === "All" || p.cat === filter);

  return (
    <section id="portfolio" className="relative overflow-hidden grain section-pad">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <SectionLabel>Chapter 07 — Selected Work</SectionLabel>
            <RevealHeading lines={["PORTFOLIO"]} className="font-display text-[15vw] md:text-9xl leading-none" />
          </div>
          <Reveal delay={0.2} className="max-w-xs pb-3">
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{portfolioNote}</p>
          </Reveal>
        </div>

        {/* Category filters */}
        <Reveal delay={0.1} className="mb-10 md:mb-14">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] border transition-all duration-300 ${
                  filter === c
                    ? "bg-[var(--gold)] text-black border-[var(--gold)] font-semibold"
                    : "border-[var(--line)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--gold)]/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => {
              const idx = projects.indexOf(p);
              return (
                <motion.button
                  key={p.cat}
                  layout
                  onClick={() => setOpen(idx)}
                  initial={{ opacity: 0, y: 44, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
                  className="group relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-[var(--line)] text-left hover:border-[var(--gold)]/60 transition-colors"
                >
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute top-5 right-5 w-10 h-10 grid place-items-center rounded-full glass opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowUpRight className="w-4 h-4 text-[var(--gold)]" />
                  </div>
                  <div className="absolute inset-0 p-6 md:p-7 flex flex-col justify-end">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-2">{p.cat}</div>
                    <h3 className="font-display text-3xl md:text-4xl leading-tight">{p.title}</h3>
                    <div className="mt-2 text-xs text-[var(--foreground)]/60">{p.count} works →</div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Project modal */}
      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-[var(--background)]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={projects[open].title}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative w-full max-w-5xl aspect-[4/5] sm:aspect-video rounded-[1.5rem] overflow-hidden border border-[var(--line)]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={projects[open].img} alt={projects[open].title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
              <div className="absolute left-6 bottom-6 right-6 md:left-10 md:bottom-10">
                <div className="text-xs uppercase tracking-[0.3em] text-[var(--gold)] mb-2">{projects[open].cat}</div>
                <div className="font-display text-4xl md:text-6xl">{projects[open].title}</div>
                <p className="mt-3 text-sm text-[var(--foreground)]/75 max-w-xl">
                  A curated showcase of {projects[open].count} selected works — galleries and video embeds open here in
                  a full cinematic viewer.
                </p>
              </div>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-11 h-11 rounded-full glass grid place-items-center hover:bg-[var(--gold)] hover:text-black transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

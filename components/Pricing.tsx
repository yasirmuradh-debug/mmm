"use client";

import { motion } from "framer-motion";
import { pricing, pricingNote } from "@/lib/data";
import { Reveal, RevealHeading, SectionLabel } from "@/components/Reveal";

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden grain section-pad">
      <div className="container-x">
        <SectionLabel>Starting From</SectionLabel>
        <RevealHeading
          lines={["TRANSPARENT", "PRICING"]}
          className="font-display text-[13vw] md:text-9xl leading-[0.9] mb-14 md:mb-20"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
          {pricing.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -10 }}
              className="group relative rounded-[1.5rem] glass-card p-8 hover:border-[var(--gold)] transition-colors flex flex-col min-h-[270px] overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_65%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-6">{p.tag}</div>
              <h3 className="font-display text-3xl md:text-4xl mb-4">{p.title}</h3>
              <div className="mt-auto">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1">From</div>
                <div className="font-display text-4xl md:text-5xl gold-text">{p.from}</div>
              </div>
            </motion.div>
          ))}
        </div>
        <Reveal delay={0.4} className="mt-10">
          <p className="text-sm text-[var(--muted-foreground)] max-w-xl">{pricingNote}</p>
        </Reveal>
      </div>
    </section>
  );
}

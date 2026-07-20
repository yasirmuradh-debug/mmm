"use client";

import { Star } from "lucide-react";
import { testimonials } from "@/lib/data";
import { RevealHeading, SectionLabel } from "@/components/Reveal";

export function Testimonials() {
  const doubled = [...testimonials, ...testimonials];
  return (
    <section id="reviews" className="relative overflow-hidden grain section-pad bg-[var(--surface)]">
      <div className="container-x">
        <SectionLabel>Trusted By Founders</SectionLabel>
        <RevealHeading
          lines={["CLIENT LOVE"]}
          className="font-display text-[14vw] md:text-9xl leading-none mb-14 md:mb-20"
        />
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{
          WebkitMaskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)",
          maskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)",
        }}
      >
        <div className="flex w-max gap-6 px-6 md:px-16 animate-marquee">
          {doubled.map((t, i) => (
            <figure
              key={i}
              className="w-[320px] md:w-[420px] shrink-0 rounded-[1.5rem] glass-card p-8 flex flex-col hover:border-[var(--gold)]/50 transition-colors"
            >
              <div className="flex gap-1 text-[var(--gold)] mb-5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-base md:text-lg text-[var(--foreground)]/85 leading-relaxed mb-6">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto">
                <div className="font-display text-2xl">{t.name}</div>
                <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] mt-1">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

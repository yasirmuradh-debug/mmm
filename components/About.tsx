"use client";

import { about, brand } from "@/lib/data";
import { Counter, Reveal, RevealHeading, SectionLabel } from "@/components/Reveal";
import { AVATAR_SRC, useAvatar } from "@/lib/useAvatar";

export function About() {
  const avatarOk = useAvatar();
  return (
    <section id="about" className="relative overflow-hidden grain section-pad bg-[var(--surface)]">
      <div className="container-x grid md:grid-cols-[1.05fr_1fr] gap-14 md:gap-24 items-center">
        <div className="relative">
          <Reveal>
            <div className="group relative rounded-[2rem] overflow-hidden border border-[var(--line)] aspect-[4/5]">
              {avatarOk ? (
                <img
                  src={AVATAR_SRC}
                  alt="Jabeer of Jabsz Studio"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-[var(--muted)] to-[var(--background)]">
                  <span className="font-display text-[8rem] gold-text leading-none select-none">J</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--background)] via-transparent to-transparent" />
              <div className="absolute left-7 bottom-7">
                <div className="font-display text-4xl tracking-wider text-[var(--foreground)] mb-1">
                  {brand.owner.toUpperCase()}
                </div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
                  {brand.location}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div>
          <SectionLabel>{about.label}</SectionLabel>
          <RevealHeading
            lines={about.heading}
            className="font-display text-6xl md:text-7xl xl:text-8xl leading-[0.92] mb-10"
          />
          <Reveal delay={0.2}>
            <p className="text-base md:text-lg leading-relaxed text-[var(--foreground)]/80 mb-5 max-w-xl">{about.p1}</p>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="text-base md:text-lg leading-relaxed text-[var(--foreground)]/60 max-w-xl">{about.p2}</p>
          </Reveal>
          <Reveal delay={0.45} className="mt-12">
            <div className="grid grid-cols-3 gap-6 max-w-md">
              {about.counters.map((c) => (
                <div key={c.label} className="text-center rounded-2xl glass-card py-6 px-2">
                  <div className="font-display text-4xl md:text-5xl text-[var(--gold)]">
                    <Counter to={c.n} suffix={c.suffix} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted-foreground)] mt-2">
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

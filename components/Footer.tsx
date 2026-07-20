"use client";

import { motion } from "framer-motion";
import { ArrowUp, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { brand, nav, socials } from "@/lib/data";

const icons = { Instagram, Linkedin, Mail, MessageCircle } as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden grain border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="container-x pt-20 pb-10">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-12 mb-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="font-display text-6xl md:text-7xl mb-4"
            >
              {brand.name}
              <span className="gold-text"> STUDIO</span>
            </motion.div>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm leading-relaxed">
              {brand.tagline}. {brand.disciplines}. {brand.location}.
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--gold)] mb-5">Navigate</div>
            <ul className="space-y-2.5">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--gold)] transition-colors"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--gold)] mb-5">Connect</div>
            <div className="flex gap-3 mb-6">
              {socials.map(({ icon, href, label }) => {
                const Icon = icons[icon as keyof typeof icons];
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 grid place-items-center rounded-full border border-[var(--line)] hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-black transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
            <a
              href="mailto:hello@jabszstudio.com"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--gold)] transition-colors"
            >
              hello@jabszstudio.com
            </a>
            <div className="text-sm text-[var(--muted-foreground)] mt-1.5">+94 74 351 4359</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-[var(--line)]">
          <div className="text-xs text-[var(--muted-foreground)] tracking-wide">
            © {new Date().getFullYear()} {brand.studio}. All rights reserved.
          </div>
          <a
            href="#home"
            aria-label="Back to top"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)] hover:text-[var(--gold)] transition-colors"
          >
            Back to top
            <span className="w-9 h-9 grid place-items-center rounded-full border border-[var(--line)] group-hover:border-[var(--gold)] transition-colors">
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

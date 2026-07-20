"use client";

import { motion } from "framer-motion";
import { Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { socials } from "@/lib/data";

const icons = { Instagram, Linkedin, Mail, MessageCircle } as const;

export function SocialDock() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-[60] hidden sm:flex flex-col gap-3"
    >
      {socials.map(({ icon, href, label }) => {
        const Icon = icons[icon as keyof typeof icons];
        return (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group w-10 h-10 grid place-items-center rounded-full glass text-[var(--foreground)] hover:text-black hover:bg-[var(--gold)] hover:border-[var(--gold)] transition-all duration-300 hover:scale-110"
          >
            <Icon className="w-4 h-4" />
          </a>
        );
      })}
      <span className="mx-auto mt-2 h-14 w-px bg-gradient-to-b from-[var(--gold)]/60 to-transparent" />
    </motion.div>
  );
}

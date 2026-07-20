"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { brand, nav } from "@/lib/data";
import { Magnetic } from "@/components/Magnetic";

export function Navbar({ onStartProject }: { onStartProject: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section for the nav indicator
  useEffect(() => {
    const ids = nav.map((n) => n.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className={`fixed top-0 inset-x-0 z-[80] transition-all duration-500 ${
          scrolled ? "glass shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]" : "bg-transparent border-transparent"
        }`}
      >
        <div className="container-x flex items-center justify-between h-[72px]">
          <a href="#home" className="flex items-center gap-3 group" aria-label="Jabsz Studio home">
            <span className="grid place-items-center w-9 h-9 rounded-full border border-[var(--gold)]/50 text-[var(--gold)] font-display text-lg leading-none pt-0.5 group-hover:bg-[var(--gold)] group-hover:text-black transition-colors duration-300">
              J
            </span>
            <span className="font-display text-xl tracking-[0.2em] text-[var(--foreground)]">
              {brand.name}
              <span className="text-[var(--gold)]"> STUDIO</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-[11px] uppercase tracking-[0.25em] transition-colors duration-300 ${
                  active === item.href ? "text-[var(--gold)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
                {active === item.href && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-4 right-4 -bottom-0.5 h-px bg-[var(--gold)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </a>
            ))}
            <Magnetic strength={0.25} className="ml-3">
              <button
                onClick={onStartProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--gold)] text-black text-[11px] uppercase tracking-[0.25em] font-semibold hover:brightness-110 transition"
              >
                Start Project <Sparkles className="w-3.5 h-3.5" />
              </button>
            </Magnetic>
          </nav>

          {/* Premium hamburger */}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden relative w-11 h-11 grid place-items-center rounded-full border border-[var(--line)] glass"
          >
            <span
              className={`absolute h-px w-5 bg-[var(--foreground)] transition-all duration-300 ${
                open ? "rotate-45" : "-translate-y-[4px]"
              }`}
            />
            <span
              className={`absolute h-px w-5 bg-[var(--foreground)] transition-all duration-300 ${
                open ? "-rotate-45" : "translate-y-[4px]"
              }`}
            />
          </button>
        </div>
      </motion.header>

      {/* Fullscreen mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 44px) 36px)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 44px) 36px)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 44px) 36px)" }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-0 z-[75] bg-[var(--background)]/97 backdrop-blur-2xl grain lg:hidden"
          >
            <div className="h-full flex flex-col justify-center px-10">
              <div className="text-[var(--gold)] text-[10px] uppercase tracking-[0.45em] mb-8">Menu</div>
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                  className="font-display text-5xl leading-[1.25] text-[var(--foreground)] hover:text-[var(--gold)] transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                onClick={() => {
                  setOpen(false);
                  onStartProject();
                }}
                className="mt-10 self-start inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--gold)] text-black text-xs uppercase tracking-[0.25em] font-semibold"
              >
                Start Project <Sparkles className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

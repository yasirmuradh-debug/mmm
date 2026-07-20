"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Linkedin, Mail, MessageCircle, Send } from "lucide-react";
import { contact, whatsappNumber } from "@/lib/data";
import { Reveal, RevealHeading, SectionLabel } from "@/components/Reveal";
import { Particles } from "@/components/Particles";
import { Magnetic } from "@/components/Magnetic";

const icons = { Mail, MessageCircle, Instagram, Linkedin } as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group block">
      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-2 group-focus-within:text-[var(--gold)] transition-colors">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--gold)] transition-colors duration-300 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 outline-none";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hi Jabsz Studio! I'm ${form.name} (${form.email}).\n\n${form.message}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="contact" className="relative overflow-hidden grain section-pad">
      <Particles count={24} />
      <div className="container-x">
        <SectionLabel>Chapter 08 — Contact</SectionLabel>
        <RevealHeading
          lines={contact.heading}
          className="font-display text-[15vw] md:text-[10rem] leading-[0.85] mb-10"
        />
        <Reveal delay={0.2}>
          <p className="text-base md:text-lg text-[var(--foreground)]/75 max-w-xl mb-14 md:mb-20">{contact.note}</p>
        </Reveal>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-24">
          {/* Contact channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 content-start">
            {contact.channels.map((c, i) => {
              const Icon = icons[c.icon as keyof typeof icons];
              return (
                <motion.a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                  whileHover={{ y: -6 }}
                  className="group relative p-6 md:p-7 rounded-[1.5rem] glass-card hover:bg-[var(--gold)] hover:border-[var(--gold)] transition-colors duration-400"
                >
                  <Icon className="w-6 h-6 mb-5 text-[var(--gold)] group-hover:text-black transition-colors" />
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] group-hover:text-black/60 mb-1.5 transition-colors">
                    {c.label}
                  </div>
                  <div className="font-display text-2xl group-hover:text-black transition-colors break-all">
                    {c.value}
                  </div>
                </motion.a>
              );
            })}
          </div>

          {/* Interactive form → WhatsApp handoff */}
          <Reveal delay={0.15}>
            <form onSubmit={submit} className="rounded-[2rem] glass-card p-8 md:p-10 space-y-7">
              <div className="text-[11px] uppercase tracking-[0.4em] text-[var(--gold)]">Send a brief</div>
              <Field label="Your Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Project Details">
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell me about your project…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <Magnetic strength={0.25}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[var(--gold)] text-black text-[11px] uppercase tracking-[0.25em] font-semibold shadow-[0_12px_44px_-12px_rgba(212,175,55,0.6)] hover:brightness-110 transition"
                >
                  Send via WhatsApp <Send className="w-4 h-4" />
                </button>
              </Magnetic>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

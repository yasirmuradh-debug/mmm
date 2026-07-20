"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { BUSINESS_CATEGORIES, ENGAGEMENT, SERVICES, URGENCY, whatsappNumber } from "@/lib/data";

const EASE = [0.2, 0.8, 0.2, 1] as const;

type FormState = {
  services: string[];
  name: string;
  company: string;
  category: string;
  email: string;
  phone: string;
  country: string;
  urgency: string;
  engagement: string;
  brief: string;
};

const initial: FormState = {
  services: [],
  name: "",
  company: "",
  category: "",
  email: "",
  phone: "",
  country: "",
  urgency: "",
  engagement: "",
  brief: "",
};

const steps = ["Services", "Your Details", "Project Brief", "Review"];

const inputCls =
  "w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--gold)] transition-colors duration-300 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 outline-none";

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-[11px] uppercase tracking-[0.15em] border transition-all duration-300 ${
        selected
          ? "bg-[var(--gold)] text-black border-[var(--gold)] font-semibold"
          : "border-[var(--line)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--gold)]/50"
      }`}
    >
      {selected && <Check className="inline w-3 h-3 mr-1.5 -mt-0.5" />}
      {label}
    </button>
  );
}

export function StartProject({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);

  const toggleService = (s: string) =>
    setForm((f) => ({
      ...f,
      services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s],
    }));

  const canNext =
    step === 0
      ? form.services.length > 0
      : step === 1
        ? form.name.trim() !== "" && (form.email.trim() !== "" || form.phone.trim() !== "")
        : true;

  const submit = () => {
    const lines = [
      `*New Project Inquiry — Jabsz Studio*`,
      ``,
      `*Services:* ${form.services.join(", ")}`,
      `*Name:* ${form.name}`,
      form.company && `*Company:* ${form.company}`,
      form.category && `*Business Category:* ${form.category}`,
      form.email && `*Email:* ${form.email}`,
      form.phone && `*Phone:* ${form.phone}`,
      form.country && `*Country:* ${form.country}`,
      form.urgency && `*Urgency:* ${form.urgency}`,
      form.engagement && `*Engagement:* ${form.engagement}`,
      form.brief && ``,
      form.brief && `*Brief:* ${form.brief}`,
    ].filter(Boolean);
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank", "noopener,noreferrer");
    onClose();
    setStep(0);
    setForm(initial);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[96] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Start your project"
        >
          <motion.div
            initial={{ y: 60, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-2xl max-h-[92svh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] glass border border-[var(--line)] bg-[var(--surface)]/95 p-7 md:p-10"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--gold)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Start Your Project
                </div>
                <div className="font-display text-4xl md:text-5xl">
                  {steps[step]}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 rounded-full border border-[var(--line)] grid place-items-center hover:bg-[var(--gold)] hover:text-black transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--line)]">
                  <motion.div
                    className="h-full bg-[var(--gold)]"
                    initial={false}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                {step === 0 && (
                  <div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-5">
                      Select every service you need — pick as many as you like.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {SERVICES.map((s) => (
                        <Chip key={s} label={s} selected={form.services.includes(s)} onClick={() => toggleService(s)} />
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Full Name *</span>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Your name" />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Company / Brand</span>
                      <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Brand name" />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Email</span>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@company.com" />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Phone / WhatsApp</span>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+94 ..." />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Country</span>
                      <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} placeholder="Sri Lanka" />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Business Category</span>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className={`${inputCls} bg-[var(--surface)]`}
                      >
                        <option value="">Select…</option>
                        {BUSINESS_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-3">Urgency</span>
                      <div className="flex flex-wrap gap-2.5">
                        {URGENCY.map((u) => (
                          <Chip key={u} label={u} selected={form.urgency === u} onClick={() => setForm({ ...form, urgency: u })} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-3">Engagement Type</span>
                      <div className="flex flex-wrap gap-2.5">
                        {ENGAGEMENT.map((u) => (
                          <Chip key={u} label={u} selected={form.engagement === u} onClick={() => setForm({ ...form, engagement: u })} />
                        ))}
                      </div>
                    </div>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-1.5">Tell me about your project</span>
                      <textarea
                        rows={4}
                        value={form.brief}
                        onChange={(e) => setForm({ ...form, brief: e.target.value })}
                        className={`${inputCls} resize-none`}
                        placeholder="Goals, deliverables, deadlines, references…"
                      />
                    </label>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 text-sm">
                    <div className="rounded-2xl glass-card p-5">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-2">Services</div>
                      <div className="text-[var(--foreground)]/85">{form.services.join(" · ") || "—"}</div>
                    </div>
                    <div className="rounded-2xl glass-card p-5 grid sm:grid-cols-2 gap-3">
                      {[
                        ["Name", form.name],
                        ["Company", form.company],
                        ["Category", form.category],
                        ["Email", form.email],
                        ["Phone", form.phone],
                        ["Country", form.country],
                        ["Urgency", form.urgency],
                        ["Engagement", form.engagement],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <span className="text-[var(--muted-foreground)]">{k}: </span>
                            <span className="text-[var(--foreground)]/90">{v}</span>
                          </div>
                        ))}
                    </div>
                    {form.brief && (
                      <div className="rounded-2xl glass-card p-5">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] mb-2">Brief</div>
                        <p className="text-[var(--foreground)]/85 leading-relaxed">{form.brief}</p>
                      </div>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Submitting opens WhatsApp with this summary pre-filled — send it and I’ll reply within 24 hours.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer nav */}
            <div className="flex items-center justify-between mt-10">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[var(--muted-foreground)] disabled:opacity-30 hover:text-[var(--foreground)] transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => canNext && setStep((s) => s + 1)}
                  disabled={!canNext}
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[var(--gold)] text-black text-[11px] uppercase tracking-[0.25em] font-semibold disabled:opacity-40 hover:brightness-110 transition"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[var(--gold)] text-black text-[11px] uppercase tracking-[0.25em] font-semibold shadow-[0_12px_44px_-12px_rgba(212,175,55,0.7)] hover:brightness-110 transition"
                >
                  Send on WhatsApp <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

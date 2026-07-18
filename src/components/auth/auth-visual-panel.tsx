"use client";

import { Activity, Brain, CalendarCheck, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const FEATURES = [
  { icon: Brain, label: "AI symptom screening", detail: "Plain-language risk read in seconds" },
  { icon: CalendarCheck, label: "Specialist matching", detail: "Book the right clinic visit" },
  { icon: ShieldCheck, label: "Privacy by design", detail: "RLS-protected patient records" },
] as const;

/**
 * Branded visual panel for the auth layout (lg+). Soft orbs + feature chips;
 * respects prefers-reduced-motion.
 */
export function AuthVisualPanel() {
  const reduce = useReducedMotion();

  return (
    <aside className="relative hidden h-full min-h-svh overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 lg:block">
      {/* Soft atmospheric orbs */}
      <motion.div
        aria-hidden
        className="absolute -left-24 top-16 size-[28rem] rounded-full bg-white/10 blur-3xl"
        animate={reduce ? undefined : { x: [0, 24, 0], y: [0, 16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-20 bottom-24 size-[22rem] rounded-full bg-emerald-300/20 blur-3xl"
        animate={reduce ? undefined : { x: [0, -20, 0], y: [0, -12, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />

      {/* Pulse watermark */}
      <div aria-hidden className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2">
        <span className="grid size-36 place-items-center rounded-[2rem] bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
          <Activity className="size-16 text-white/90" strokeWidth={2.25} />
        </span>
      </div>

      {/* Feature chips */}
      <div className="absolute inset-x-0 top-[48%] px-12">
        <ul className="mx-auto flex max-w-md flex-col gap-3">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.label}
              className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 0.1 + i * 0.08, ease: "easeOut" }}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
                <f.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{f.label}</p>
                <p className="truncate text-xs text-white/75">{f.detail}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Quote anchor */}
      <div className="absolute inset-x-0 bottom-0 p-12 text-white">
        <blockquote className="space-y-3">
          <p className="text-2xl font-medium leading-snug text-balance">
            &ldquo;Early awareness saves lives. ProMediCare AI helps you understand your
            symptoms and connect with the right specialist &mdash; faster.&rdquo;
          </p>
          <footer className="text-sm text-white/80">
            AI-assisted screening &middot; Decision support, not diagnosis
          </footer>
        </blockquote>
      </div>
    </aside>
  );
}

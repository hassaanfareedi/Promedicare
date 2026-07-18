"use client";

import { Activity, Brain, CalendarCheck, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const FEATURES = [
  { icon: Brain, label: "AI symptom screening", detail: "Plain-language risk read in seconds" },
  { icon: CalendarCheck, label: "Specialist matching", detail: "Book the right clinic visit" },
  { icon: ShieldCheck, label: "Privacy by design", detail: "RLS-protected patient records" },
] as const;

/**
 * Branded visual panel for the auth layout (lg+).
 * Single flex column: mark → features → quote. No absolute content stacking.
 */
export function AuthVisualPanel() {
  const reduce = useReducedMotion();

  return (
    <aside className="relative hidden h-full min-h-svh overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 lg:flex">
      {/* Atmosphere — decorative only */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 top-10 size-[26rem] rounded-full bg-white/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, 20, 0], y: [0, 14, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 bottom-20 size-[20rem] rounded-full bg-teal-200/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, -16, 0], y: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/40 via-transparent to-teal-900/20" />
      </div>

      {/* Content stack — never overlaps */}
      <div className="relative z-10 flex h-full w-full flex-col px-10 py-12 xl:px-14">
        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="flex flex-col items-start gap-3">
            <span
              aria-hidden
              className="grid size-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm"
            >
              <Activity className="size-7 text-white" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-medium tracking-wide text-white/70">ProMediCare AI</p>
              <h2 className="mt-1 max-w-sm text-3xl font-semibold tracking-tight text-white text-balance xl:text-4xl">
                Care that starts with clarity
              </h2>
            </div>
          </div>

          <ul className="flex max-w-md flex-col gap-2.5">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.label}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md"
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: reduce ? 0 : 0.08 + i * 0.06, ease: "easeOut" }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
                  <f.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{f.label}</p>
                  <p className="truncate text-xs text-white/70">{f.detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <blockquote className="mt-8 shrink-0 space-y-2 border-t border-white/15 pt-8 text-white">
          <p className="max-w-lg text-lg font-medium leading-snug text-pretty xl:text-xl">
            Early awareness saves lives. Understand your symptoms and see the right specialist —
            faster.
          </p>
          <footer className="text-xs text-white/70 xl:text-sm">
            AI-assisted screening · Decision support, not diagnosis
          </footer>
        </blockquote>
      </div>
    </aside>
  );
}

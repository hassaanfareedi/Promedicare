"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Subtle animated "aurora" glow used behind the hero. Vengeance-UI-style
 * scene field kept low-contrast and disabled under reduced-motion.
 */
export function AuroraBackground() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 via-background to-background dark:from-teal-950/30 dark:via-background" />
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,theme(colors.teal.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.teal.300)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)] dark:opacity-[0.08]" />
      <motion.div
        className="absolute -top-24 left-1/4 size-[36rem] rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/10"
        animate={reduce ? undefined : { x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-16 right-1/4 size-[30rem] rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
        animate={reduce ? undefined : { x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

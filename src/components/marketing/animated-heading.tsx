"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Word-by-word reveal for hero headings (Vengeance-UI-style animated copy).
 * Renders plain text under reduced-motion. `accent` words get the brand gradient.
 */
export function AnimatedHeading({
  lead,
  accent,
  className,
}: {
  lead: string;
  accent: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const leadWords = lead.split(" ");
  const accentWords = accent.split(" ");

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const word = {
    hidden: { opacity: 0, y: "0.4em" },
    show: { opacity: 1, y: "0em", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  };

  if (reduce) {
    return (
      <h1 className={className}>
        {lead}{" "}
        <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          {accent}
        </span>
      </h1>
    );
  }

  return (
    <motion.h1 className={className} variants={container} initial="hidden" animate="show">
      {leadWords.map((w, i) => (
        <span key={`l-${i}`}>
          <motion.span variants={word} className="inline-block">
            {w}
          </motion.span>{" "}
        </span>
      ))}
      {accentWords.map((w, i) => (
        <span key={`a-${i}`}>
          <motion.span
            variants={word}
            className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent"
          >
            {w}
          </motion.span>{" "}
        </span>
      ))}
    </motion.h1>
  );
}

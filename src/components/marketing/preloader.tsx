"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity } from "lucide-react";

/**
 * Smooth one-time preloader shown on first homepage load in a session.
 * Respects reduced-motion and never blocks interaction for long.
 */
export function Preloader() {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip the animated splash entirely when the user prefers reduced motion.
    if (reduce) {
      sessionStorage.setItem("pmc_preloaded", "1");
      return;
    }
    const seen = sessionStorage.getItem("pmc_preloaded");
    if (seen) return;
    setVisible(true);
    sessionStorage.setItem("pmc_preloaded", "1");
    const t = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          aria-hidden
        >
          <motion.div
            className="flex flex-col items-center gap-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.span
              className="grid size-20 place-items-center rounded-3xl bg-white/15 backdrop-blur"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Activity className="size-10 text-white" strokeWidth={2.5} />
            </motion.span>
            <div className="flex flex-col items-center gap-3">
              <p className="text-xl font-semibold tracking-tight text-white">
                ProMediCare <span className="text-white/80">AI</span>
              </p>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full bg-white"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

type Section = { label: string; href: string };

const SECTIONS: Section[] = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Record lookup", href: "#lookup" },
];

/**
 * Marketing header with a Vengeance-UI-style hover "spotlight" that glides
 * behind the active nav item. Falls back gracefully with no motion and stays
 * keyboard accessible.
 */
export function SpotlightNav({ isAuthed, homeHref }: { isAuthed: boolean; homeHref: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="ProMediCare AI home" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="hidden md:block" aria-label="Primary">
          <ul
            ref={listRef}
            onMouseLeave={() => setHovered(null)}
            className="relative flex items-center gap-1 text-sm font-medium"
          >
            {SECTIONS.map((s, i) => (
              <li key={s.href} className="relative">
                <a
                  href={s.href}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  className="relative z-10 inline-block rounded-full px-4 py-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  {s.label}
                </a>
                {hovered === i && (
                  <motion.span
                    layoutId="nav-spotlight"
                    className="absolute inset-0 -z-0 rounded-full bg-teal-500/10 ring-1 ring-teal-500/20 dark:bg-teal-400/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link href={homeHref} className={buttonVariants({ size: "sm" })}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
              >
                Sign in
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg border text-muted-foreground md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t bg-background md:hidden"
            aria-label="Primary mobile"
          >
            <ul className="space-y-1 px-4 py-3 text-sm font-medium">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
              {!isAuthed && (
                <li>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

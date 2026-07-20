"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Safeguard against overlay libraries (menus, popovers, dialogs) that lock
 * `document.body` interactivity while open and occasionally fail to release it
 * when a navigation unmounts them mid-transition. Without this, a stuck
 * `pointer-events: none` (or `inert`) deadens every click — including the
 * sidebar nav — until a full reload.
 *
 * Clears on mount and route change, and also on capture-phase pointerdown so a
 * locked body can be unlocked *before* the click is lost (chicken-and-egg with
 * soft navigation that never updates pathname).
 */
function clearPointerLocks() {
  if (typeof document === "undefined") return;

  for (const el of [document.body, document.documentElement]) {
    if (el.style.pointerEvents === "none") {
      el.style.pointerEvents = "";
    }
    if (el.hasAttribute("inert")) {
      el.removeAttribute("inert");
    }
  }
}

export function PointerEventsGuard() {
  const pathname = usePathname();

  useEffect(() => {
    clearPointerLocks();
  }, [pathname]);

  useEffect(() => {
    clearPointerLocks();
    const onPointerDown = () => clearPointerLocks();
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}

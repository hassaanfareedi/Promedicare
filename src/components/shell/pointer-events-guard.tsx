"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Safeguard against overlay libraries (menus, popovers, dialogs) that lock
 * `document.body` interactivity while open and occasionally fail to release it
 * when a navigation unmounts them mid-transition. Without this, a stuck
 * `pointer-events: none` deadens every click — including the sidebar nav —
 * until a full reload. Resetting on each route change keeps the app clickable.
 */
export function PointerEventsGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
  }, [pathname]);

  return null;
}

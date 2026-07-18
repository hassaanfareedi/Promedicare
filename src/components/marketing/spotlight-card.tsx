"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a cursor-following radial spotlight (Vengeance-UI-style hover
 * effect). The glow is purely decorative and does not affect layout or a11y.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setPos(null)}
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md",
        className,
      )}
    >
      {pos && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, color-mix(in oklch, var(--color-teal-500, #14b8a6) 18%, transparent), transparent 70%)`,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

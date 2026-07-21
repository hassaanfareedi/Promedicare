"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Persistent AI disclaimer. Rendered by the UI layer wherever AI output is
 * shown — never relying on the model to self-disclaim.
 */
export function AiDisclaimer({ className, compact = false }: { className?: string; compact?: boolean }) {
  const tAi = useTranslations("ai");
  const tPatient = useTranslations("patient");
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className={cn("text-amber-900/90 dark:text-amber-200/90", compact ? "text-xs" : "text-sm")}>
        {compact ? tPatient("decisionSupportOnly") : tAi("disclaimer")}
      </p>
    </div>
  );
}

import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_DISCLAIMER } from "@/lib/constants";

/**
 * Persistent AI disclaimer. Rendered by the UI layer wherever AI output is
 * shown — never relying on the model to self-disclaim.
 */
export function AiDisclaimer({ className, compact = false }: { className?: string; compact?: boolean }) {
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
        {compact
          ? "Decision support only — not a medical diagnosis. Consult a licensed professional."
          : AI_DISCLAIMER}
      </p>
    </div>
  );
}

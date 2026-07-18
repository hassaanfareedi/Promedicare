import { cn } from "@/lib/utils";
import { RISK_META } from "@/lib/constants";
import type { RiskLevel } from "@/types";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      {meta.label} risk
    </span>
  );
}

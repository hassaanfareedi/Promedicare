"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getRiskTone } from "@/lib/constants";
import type { RiskLevel } from "@/types";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const t = useTranslations("risk");
  const key = (level in { low: 1, medium: 1, high: 1, urgent: 1 } ? level : "unknown") as
    | RiskLevel
    | "unknown";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        getRiskTone(level),
        className,
      )}
    >
      {t(key)}
    </span>
  );
}

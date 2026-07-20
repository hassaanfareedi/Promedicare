import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        {Icon && (
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-muted text-brand transition-transform duration-300 group-hover:scale-105">
            <Icon className="size-5" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

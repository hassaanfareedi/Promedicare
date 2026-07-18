import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { id: string; label: string };

/**
 * Persistent progress stepper used across symptom intake, booking and onboarding.
 * `current` is the zero-based index of the active step.
 */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex w-full items-center", className)} aria-label="Progress">
      {steps.map((step, index) => {
        const isComplete = index < current;
        const isActive = index === current;
        return (
          <li key={step.id} className={cn("flex items-center", index < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2.5">
              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium transition-colors",
                  isComplete && "border-teal-600 bg-teal-600 text-white",
                  isActive && "border-teal-600 text-teal-700 dark:text-teal-400",
                  !isComplete && !isActive && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 transition-colors",
                  isComplete ? "bg-teal-600" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

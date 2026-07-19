import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { box: "size-7", icon: "size-4", text: "text-base" },
  md: { box: "size-9", icon: "size-5", text: "text-lg" },
  lg: { box: "size-12", icon: "size-7", text: "text-2xl" },
};

export function Logo({ className, iconOnly = false, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm",
          s.box,
        )}
      >
        <Activity className={cn(s.icon, "stroke-[2.5]")} aria-hidden />
      </span>
      {!iconOnly && (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          ProMediCare<span className="text-teal-600 dark:text-teal-400"> AI</span>
        </span>
      )}
      {iconOnly && <span className="sr-only">{APP_NAME}</span>}
    </span>
  );
}

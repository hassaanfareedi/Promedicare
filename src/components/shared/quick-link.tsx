import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickLinkProps = {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
};

/** Dashboard quick-nav tile used across admin / platform / staff homes. */
export function QuickLink({ href, title, description, icon: Icon, className }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border bg-card p-4 ring-1 ring-foreground/5 transition-all hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-muted text-brand transition-transform group-hover:scale-105">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">{title}</span>
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </span>
        {description && (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        )}
      </span>
    </Link>
  );
}

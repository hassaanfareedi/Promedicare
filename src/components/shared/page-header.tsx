import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  /** Larger, welcoming title for dashboard/landing surfaces. */
  hero?: boolean;
};

export function PageHeader({ title, description, actions, className, hero = false }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:justify-between",
        hero ? "sm:items-end" : "sm:items-center",
        className,
      )}
    >
      <div className="flex items-stretch gap-3">
        <span
          aria-hidden
          className={cn(
            "w-1 shrink-0 rounded-full bg-gradient-to-b from-brand to-[oklch(0.55_0.12_165)]",
            hero ? "mt-1 min-h-10" : "mt-0.5 min-h-7",
          )}
        />
        <div className="space-y-1">
          <h1
            className={cn(
              "font-heading font-semibold tracking-tight text-balance",
              hero ? "text-3xl" : "text-2xl",
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "text-pretty text-muted-foreground",
                hero ? "max-w-xl text-sm sm:text-base" : "text-sm",
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            hero && "shrink-0 self-start sm:self-auto",
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

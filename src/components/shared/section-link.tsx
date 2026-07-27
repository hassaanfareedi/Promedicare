import { ArrowRight } from "lucide-react";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
import { cn } from "@/lib/utils";

type SectionLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** Consistent “View all” / section navigation link. */
export function SectionLink({ href, children, className }: SectionLinkProps) {
  return (
    <ReliableNavLink
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </ReliableNavLink>
  );
}

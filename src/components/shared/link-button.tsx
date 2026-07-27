"use client";

import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof ReliableNavLink> & VariantProps<typeof buttonVariants>;

/**
 * Button-styled internal navigation link with the stalled soft-nav guard from
 * {@link ReliableNavLink}. Use anywhere a `<Link className={buttonVariants(...)}>`
 * would otherwise be used, so a poisoned RSC flight can't leave the click as a
 * no-op that requires a manual hard refresh.
 */
export function LinkButton({ href, variant, size, className, children, ...rest }: Props) {
  return (
    <ReliableNavLink
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </ReliableNavLink>
  );
}

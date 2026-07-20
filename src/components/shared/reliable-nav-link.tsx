"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps, type MouseEvent } from "react";
import { scheduleStalledNavGuard } from "@/lib/nav/nav-fallback";

type Props = Omit<ComponentProps<typeof Link>, "prefetch" | "onClick"> & {
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function targetMatches(href: string): boolean {
  const target = new URL(href, window.location.origin);
  return (
    window.location.pathname === target.pathname &&
    window.location.search === target.search
  );
}

/**
 * Next.js Link with a hard-navigation fallback. Soft App Router transitions can
 * silently no-op after server actions / poisoned RSC flights; if the URL has not
 * changed after a short delay, force a full load (path + query aware).
 */
export function ReliableNavLink({ href, onClick, children, ...props }: Props) {
  const router = useRouter();
  const latestHrefRef = useRef<string | null>(null);
  const hrefString = typeof href === "string" ? href : href.pathname ?? String(href);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    event.preventDefault();
    if (targetMatches(hrefString)) return;

    latestHrefRef.current = hrefString;
    router.push(hrefString);

    scheduleStalledNavGuard(
      hrefString,
      () => targetMatches(hrefString),
      () => latestHrefRef.current === hrefString,
    );
  }

  return (
    <Link href={href} prefetch={false} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}

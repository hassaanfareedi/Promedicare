/**
 * Recovery for stalled App Router soft navigations.
 *
 * This app's soft navigations occasionally no-op after a poisoned RSC flight.
 * A `loading.tsx` boundary hides that stall inside a Suspense fallback that
 * never resolves, so the URL updates instantly but the page content never
 * arrives. We can't rely on pathname alone, so we watch for two failure modes
 * and force a full load if either persists:
 *
 * 1. The URL never advanced to the target (segments without a `loading.tsx`).
 * 2. The URL advanced but a route-level loading skeleton is still mounted
 *    (a `loading.tsx` swallowed a stalled flight).
 */

/** True while a route-level `loading.tsx` skeleton is still on screen. */
function routeStillLoading(): boolean {
  return (
    typeof document !== "undefined" &&
    document.querySelector("[data-route-loading]") !== null
  );
}

/**
 * Schedule hard-navigation fallbacks after a `router.push(href)`.
 *
 * @param href       Destination to force-load if the soft navigation stalls.
 * @param hasArrived Returns true once the target route has committed.
 * @param isCurrent  Returns false if a newer navigation has superseded this one
 *                   (prevents a stale timer from hijacking the page).
 */
export function scheduleStalledNavGuard(
  href: string,
  hasArrived: () => boolean,
  isCurrent: () => boolean,
): void {
  if (typeof window === "undefined") return;

  // Guard 1: URL never advanced (soft-nav no-op without a loading.tsx).
  window.setTimeout(() => {
    if (!isCurrent()) return;
    if (!hasArrived()) window.location.assign(href);
  }, 500);

  // Guard 2: URL advanced but the loading skeleton never resolved.
  window.setTimeout(() => {
    if (!isCurrent()) return;
    if (hasArrived() && routeStillLoading()) window.location.assign(href);
  }, 3000);
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types";
import { ROLE_HOME, ROLE_PREFIX } from "@/lib/constants";

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/auth", "/records"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

/**
 * Soft App Router / prefetch / RSC flights. A middleware redirect here gets
 * cached by the client and then deadens the matching <Link> until a hard reload.
 */
function isSoftNavigation(request: NextRequest): boolean {
  return (
    request.headers.get("rsc") === "1" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.has("next-router-segment-prefetch") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose")?.includes("prefetch") ?? false)
  );
}

/**
 * Refreshes the Supabase session on every request and enforces coarse-grained,
 * role-aware route protection. This is the first of three RBAC layers
 * (middleware -> layout guards -> RLS).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const softNav = isSoftNavigation(request);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Soft-nav: refresh session/cookies only — never redirect. Layout `requireRole`
  // still enforces access on the real document render.
  if (softNav) return response;

  const { pathname } = request.nextUrl;

  // Build a redirect that carries over any auth cookies Supabase refreshed onto
  // `response`. Dropping them desyncs the browser/server session, which can
  // silently break subsequent client-side (RSC) navigations until a full
  // reload — exactly the "links only work after refresh" failure mode.
  const redirectTo = (build: (url: URL) => void): NextResponse => {
    const url = request.nextUrl.clone();
    build(url);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // Unauthenticated users may only access public routes.
  if (!user) {
    if (isPublicPath(pathname)) return response;
    return redirectTo((url) => {
      url.pathname = "/login";
      url.searchParams.set("redirectTo", `${pathname}${request.nextUrl.search}`);
    });
  }

  // Authenticated: resolve role + onboarding state for gating.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  // If the profile lookup failed (transient error / RLS hiccup), do not issue
  // role or onboarding redirects. The server layout guards (`requireRole`) still
  // enforce access on the actual render.
  if (!profile) return response;

  const role = profile.role as UserRole;
  const onboarded = profile.onboarding_completed ?? false;

  // Keep signed-in users out of the auth pages (document navigations only).
  if (["/login", "/register", "/forgot-password"].some((p) => pathname.startsWith(p))) {
    return redirectTo((url) => {
      url.pathname = ROLE_HOME[role];
    });
  }

  // Profile-completion gate (patients complete an onboarding profile).
  // Allow password recovery while onboarding is incomplete.
  const onboardingExempt =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");
  if (!onboarded && role === "patient" && !onboardingExempt) {
    return redirectTo((url) => {
      url.pathname = "/onboarding";
    });
  }

  // Role-prefix guard: a role may only enter its own portal area.
  const portalPrefixes = Object.values(ROLE_PREFIX);
  const inSomePortal = portalPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (inSomePortal) {
    const allowed = pathname.startsWith(ROLE_PREFIX[role]);
    if (!allowed) {
      return redirectTo((url) => {
        url.pathname = ROLE_HOME[role];
      });
    }
  }

  return response;
}

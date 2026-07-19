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
 * Refreshes the Supabase session on every request and enforces coarse-grained,
 * role-aware route protection. This is the first of three RBAC layers
 * (middleware -> layout guards -> RLS).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const { pathname } = request.nextUrl;

  // Unauthenticated users may only access public routes.
  if (!user) {
    if (isPublicPath(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectTo = `${pathname}${request.nextUrl.search}`;
    url.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(url);
  }

  // Authenticated: resolve role + onboarding state for gating.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "patient") as UserRole;
  const onboarded = profile?.onboarding_completed ?? false;

  // Keep signed-in users out of the auth pages.
  if (["/login", "/register", "/forgot-password"].some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    return NextResponse.redirect(url);
  }

  // Profile-completion gate (patients complete an onboarding profile).
  // Allow password recovery while onboarding is incomplete.
  const onboardingExempt =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");
  if (!onboarded && role === "patient" && !onboardingExempt) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Role-prefix guard: a role may only enter its own portal area.
  const portalPrefixes = Object.values(ROLE_PREFIX);
  const inSomePortal = portalPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (inSomePortal) {
    const allowed = pathname.startsWith(ROLE_PREFIX[role]);
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }
  }

  return response;
}

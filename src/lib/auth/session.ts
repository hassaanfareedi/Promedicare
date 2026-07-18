import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/constants";
import type { Profile, UserRole } from "@/types";

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile;
};

/**
 * Returns the authenticated user + profile, or null. Cached per request so
 * repeated calls in a render pass hit the DB once.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, profile };
});

/** Require any authenticated user; redirect to login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require one of the given roles; redirect to the user's own home otherwise. */
export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.profile.role)) {
    redirect(ROLE_HOME[user.profile.role]);
  }
  return user;
}

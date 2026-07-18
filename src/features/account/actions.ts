"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { ROLE_SETTINGS } from "@/lib/constants";
import {
  updateAccountSchema,
  changePasswordSchema,
  type UpdateAccountInput,
  type ChangePasswordInput,
} from "@/schemas/account";
import type { MutationResult } from "@/features/patient/actions";

function revalidateAccountPaths(role: keyof typeof ROLE_SETTINGS) {
  revalidatePath(ROLE_SETTINGS[role]);
  revalidatePath(ROLE_SETTINGS[role].replace(/\/settings$/, ""));
}

/** Update the signed-in user's profile name and phone. */
export async function updateAccount(input: UpdateAccountInput): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      phone: v.phone || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "account.updated",
    entityType: "profile",
    entityId: user.id,
  });

  revalidateAccountPaths(user.profile.role);
  return { ok: true };
}

/** Change password while signed in. */
export async function changePassword(input: ChangePasswordInput): Promise<MutationResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "account.password_changed",
    entityType: "profile",
    entityId: user.id,
  });

  return { ok: true };
}

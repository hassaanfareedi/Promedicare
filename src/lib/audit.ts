import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type AuditInput = {
  action: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Json;
};

/**
 * Fire-and-forget audit write. The actor is resolved from the caller's session
 * and the row is inserted with the service-role client, so direct execute on
 * the `log_audit` RPC can stay revoked (prevents forged audit entries).
 */
export async function logAudit({ action, entityType, entityId, metadata }: AuditInput): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: user?.id ?? null,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? null,
    });
  } catch {
    // Audit failures must never break the primary operation.
  }
}

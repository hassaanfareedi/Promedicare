import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type AuditInput = {
  action: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Json;
};

/** Fire-and-forget audit log write via the SECURITY DEFINER RPC. */
export async function logAudit({ action, entityType, entityId, metadata }: AuditInput): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_audit", {
      p_action: action,
      p_entity_type: entityType ?? undefined,
      p_entity_id: entityId ?? undefined,
      p_metadata: metadata ?? undefined,
    });
  } catch {
    // Audit failures must never break the primary operation.
  }
}

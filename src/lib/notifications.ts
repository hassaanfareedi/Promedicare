import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { NotificationType } from "@/types";

type NotifyInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Json;
};

/** Create an in-app notification for another user via the SECURITY DEFINER RPC. */
export async function notify({ recipientId, type, title, body, data }: NotifyInput): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("create_notification", {
      p_recipient: recipientId,
      p_type: type,
      p_title: title,
      p_body: body ?? undefined,
      p_data: data ?? undefined,
    });
  } catch {
    // Notification failures must never break the primary operation.
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { predictionReviewSchema, type PredictionReviewInput } from "@/schemas/prediction";
import {
  updateAppointmentStatusSchema,
  type UpdateAppointmentStatusInput,
} from "@/schemas/appointment";
import type { MutationResult } from "@/features/patient/actions";
import type { TablesUpdate } from "@/types/database";

/** Doctor reviews an AI screening, recording an outcome and optional notes. */
export async function reviewPrediction(
  input: PredictionReviewInput,
): Promise<MutationResult> {
  const user = await requireRole(["doctor", "hospital_admin", "super_admin"]);
  const parsed = predictionReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("predictions")
    .update({
      status: v.status,
      review_notes: v.reviewNotes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", v.predictionId)
    .select("id, created_by")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Screening not found or not accessible." };

  if (updated.created_by) {
    await notify({
      recipientId: updated.created_by,
      type: "prediction_reviewed",
      title: "Your screening was reviewed",
      body: "A clinician has reviewed your recent AI symptom screening.",
      data: { predictionId: updated.id },
    });
  }

  await logAudit({
    action: "prediction.reviewed",
    entityType: "prediction",
    entityId: updated.id,
    metadata: { status: v.status },
  });

  revalidatePath("/doctor/reviews");
  revalidatePath("/doctor");
  return { ok: true };
}

/** Doctor updates the status of one of their appointments (check-in, complete, etc.). */
export async function updateAppointmentStatus(
  input: UpdateAppointmentStatusInput,
): Promise<MutationResult> {
  await requireRole(["doctor", "receptionist", "hospital_admin", "super_admin"]);
  const parsed = updateAppointmentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const patch: TablesUpdate<"appointments"> = { status: v.status };
  if (v.status === "checked_in") patch.checked_in_at = new Date().toISOString();
  if (v.status === "completed") patch.checked_out_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("id", v.appointmentId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Appointment not found or not accessible." };

  await logAudit({
    action: "appointment.status_changed",
    entityType: "appointment",
    entityId: updated.id,
    metadata: { status: v.status },
  });

  revalidatePath("/doctor/schedule");
  revalidatePath("/doctor");
  revalidatePath("/reception/queue");
  return { ok: true };
}

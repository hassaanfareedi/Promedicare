"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { attachmentMetaSchema } from "@/schemas/clinical";
import type { MutationResult } from "@/features/patient/actions";
import { getMyDoctor } from "@/features/doctor/data";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
]);

/** Doctor uploads a clinical attachment for a visit. */
export async function uploadMedicalAttachment(
  formData: FormData,
): Promise<MutationResult<{ id: string }>> {
  const user = await requireRole(["doctor"]);
  const doctor = await getMyDoctor();
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) return { ok: false, error: "File must be 10 MB or smaller." };
  if (file.type && !ALLOWED.has(file.type)) {
    return { ok: false, error: "Unsupported file type." };
  }

  const meta = attachmentMetaSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    patientId: formData.get("patientId"),
    kind: formData.get("kind") || "other",
    fileName: file.name,
    mimeType: file.type || undefined,
  });
  if (!meta.success) {
    return { ok: false, error: meta.error.issues[0]?.message ?? "Invalid attachment metadata" };
  }
  const v = meta.data;

  const supabase = await createClient();
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("id, patient_id, hospital_id, doctor_id")
    .eq("id", v.appointmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (apptErr) return { ok: false, error: apptErr.message };
  if (!appt) return { ok: false, error: "Appointment not found." };
  if (appt.doctor_id !== doctor.id) {
    return { ok: false, error: "You can only upload files for your appointments." };
  }
  if (appt.patient_id !== v.patientId) {
    return { ok: false, error: "Patient does not match this appointment." };
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 180);
  const path = `${appt.hospital_id}/${appt.patient_id}/${appt.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from("medical-files")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data: row, error: rowErr } = await supabase
    .from("medical_attachments")
    .insert({
      patient_id: appt.patient_id,
      appointment_id: appt.id,
      hospital_id: appt.hospital_id,
      uploaded_by: user.id,
      file_path: path,
      file_name: v.fileName,
      mime_type: v.mimeType || file.type || null,
      kind: v.kind,
    })
    .select("id")
    .single();

  if (rowErr || !row) {
    await supabase.storage.from("medical-files").remove([path]);
    return { ok: false, error: rowErr?.message ?? "Could not save attachment metadata." };
  }

  await logAudit({
    action: "medical_attachment.uploaded",
    entityType: "medical_attachment",
    entityId: row.id,
    metadata: { appointmentId: appt.id },
  });

  revalidatePath(`/doctor/patients/${appt.patient_id}`);
  revalidatePath("/patient/records");
  return { ok: true, data: { id: row.id } };
}

/** Signed URL for downloading a medical attachment the caller can access. */
export async function getAttachmentSignedUrl(
  attachmentId: string,
): Promise<MutationResult<{ url: string }>> {
  await requireRole(["doctor", "patient", "hospital_admin", "receptionist", "super_admin"]);
  const supabase = await createClient();

  const { data: att, error } = await supabase
    .from("medical_attachments")
    .select("id, file_path")
    .eq("id", attachmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!att) return { ok: false, error: "Attachment not found." };

  const { data: signed, error: signErr } = await supabase.storage
    .from("medical-files")
    .createSignedUrl(att.file_path, 60 * 10);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, error: signErr?.message ?? "Could not create download link." };
  }
  return { ok: true, data: { url: signed.signedUrl } };
}

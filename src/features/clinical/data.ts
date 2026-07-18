import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ConsultationNote, MedicationLine } from "@/types";
import type { Json } from "@/types/database";

export type MedicalVisit = {
  appointmentId: string;
  scheduledStart: string;
  status: string;
  diagnosis: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  prescription: string | null;
  medications: MedicationLine[];
  noteId: string | null;
  doctorName: string | null;
  attachments: {
    id: string;
    file_name: string;
    kind: string;
    mime_type: string | null;
    created_at: string;
  }[];
};

function parseMedications(value: Json | null): MedicationLine[] {
  if (!Array.isArray(value)) return [];
  const out: MedicationLine[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name : "";
    if (!name) continue;
    out.push({
      name,
      dose: typeof r.dose === "string" ? r.dose : "",
      frequency: typeof r.frequency === "string" ? r.frequency : "",
      duration: typeof r.duration === "string" ? r.duration : "",
      instructions: typeof r.instructions === "string" ? r.instructions : "",
    });
  }
  return out;
}

/** Visit history + attachments for a patient (RLS-scoped). */
export async function getPatientMedicalFile(patientId: string): Promise<{
  patient: { id: string; full_name: string; patient_code: string } | null;
  visits: MedicalVisit[];
}> {
  const supabase = await createClient();

  const [{ data: patient }, { data: appointments }, { data: notes }, { data: attachments }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("id, full_name, patient_code")
        .eq("id", patientId)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("appointments")
        .select("id, scheduled_start, status, doctor_id")
        .eq("patient_id", patientId)
        .is("deleted_at", null)
        .order("scheduled_start", { ascending: false })
        .limit(50),
      supabase
        .from("consultation_notes")
        .select("*")
        .eq("patient_id", patientId)
        .is("deleted_at", null),
      supabase
        .from("medical_attachments")
        .select("id, appointment_id, file_name, kind, mime_type, created_at")
        .eq("patient_id", patientId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ]);

  if (!patient) return { patient: null, visits: [] };

  const noteByAppt = new Map((notes ?? []).map((n) => [n.appointment_id, n as ConsultationNote]));
  const doctorIds = [
    ...new Set(
      (appointments ?? []).map((a) => a.doctor_id).filter((v): v is string => Boolean(v)),
    ),
  ];
  const { data: doctors } = doctorIds.length
    ? await supabase.from("doctor_directory").select("id, full_name").in("id", doctorIds)
    : { data: [] as { id: string | null; full_name: string | null }[] };
  const doctorMap = new Map((doctors ?? []).map((d) => [d.id, d.full_name]));

  const attByAppt = new Map<string, MedicalVisit["attachments"]>();
  for (const att of attachments ?? []) {
    if (!att.appointment_id) continue;
    const list = attByAppt.get(att.appointment_id) ?? [];
    list.push({
      id: att.id,
      file_name: att.file_name,
      kind: att.kind,
      mime_type: att.mime_type,
      created_at: att.created_at,
    });
    attByAppt.set(att.appointment_id, list);
  }

  const visits: MedicalVisit[] = (appointments ?? []).map((a) => {
    const note = noteByAppt.get(a.id);
    return {
      appointmentId: a.id,
      scheduledStart: a.scheduled_start,
      status: a.status,
      diagnosis: note?.diagnosis ?? null,
      subjective: note?.subjective ?? null,
      objective: note?.objective ?? null,
      assessment: note?.assessment ?? null,
      plan: note?.plan ?? null,
      prescription: note?.prescription ?? null,
      medications: parseMedications(note?.medications ?? null),
      noteId: note?.id ?? null,
      doctorName: a.doctor_id ? (doctorMap.get(a.doctor_id) ?? null) : null,
      attachments: attByAppt.get(a.id) ?? [],
    };
  });

  return { patient, visits };
}

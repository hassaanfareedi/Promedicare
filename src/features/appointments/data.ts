import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DoctorDirectory, Hospital } from "@/types";

export type BookingHospital = Pick<Hospital, "id" | "name" | "city">;

/** Active hospitals a patient can book into. */
export async function getBookingHospitals(): Promise<BookingHospital[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hospitals")
    .select("id, name, city")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");
  return data ?? [];
}

/** Non-sensitive doctor directory rows for all active doctors. */
export async function getBookingDoctors(): Promise<DoctorDirectory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctor_directory")
    .select("*")
    .order("full_name");
  return data ?? [];
}

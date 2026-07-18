-- ProMediCare AI — public doctor directory
-- Patients cannot read staff `profiles` rows under RLS, but they must see basic,
-- non-sensitive doctor info to browse and book. This view runs with the owner's
-- privileges (security_invoker = false) and exposes ONLY non-sensitive columns
-- for active, non-deleted doctors. No email, phone, license, or ids beyond what
-- booking needs.
create or replace view public.doctor_directory
with (security_invoker = false) as
select
  d.id,
  d.hospital_id,
  d.department_id,
  d.specialty_id,
  p.full_name,
  p.avatar_url,
  s.name as specialty_name,
  s.slug as specialty_slug,
  dep.name as department_name,
  d.years_experience,
  d.consultation_fee,
  d.bio
from public.doctors d
join public.profiles p on p.id = d.profile_id
left join public.specialties s on s.id = d.specialty_id
left join public.departments dep on dep.id = d.department_id
where d.deleted_at is null and d.is_active and p.deleted_at is null;

grant select on public.doctor_directory to anon, authenticated;

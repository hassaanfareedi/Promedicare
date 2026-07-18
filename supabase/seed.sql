-- ProMediCare AI — reference/demo seed data (idempotent)

insert into public.specialties (name, slug, description) values
  ('General Medicine', 'general-medicine', 'Primary care and general adult medicine'),
  ('Cardiology', 'cardiology', 'Heart and cardiovascular system'),
  ('Dermatology', 'dermatology', 'Skin, hair and nails'),
  ('Neurology', 'neurology', 'Brain and nervous system'),
  ('Pediatrics', 'pediatrics', 'Infant, child and adolescent health'),
  ('Orthopedics', 'orthopedics', 'Bones, joints and musculoskeletal system'),
  ('Gastroenterology', 'gastroenterology', 'Digestive system'),
  ('Pulmonology', 'pulmonology', 'Lungs and respiratory system'),
  ('ENT', 'ent', 'Ear, nose and throat'),
  ('Psychiatry', 'psychiatry', 'Mental health'),
  ('Endocrinology', 'endocrinology', 'Hormones and metabolism'),
  ('Gynecology', 'gynecology', 'Women''s reproductive health'),
  ('Ophthalmology', 'ophthalmology', 'Eye care'),
  ('Urology', 'urology', 'Urinary tract and male reproductive system')
on conflict (slug) do nothing;

insert into public.hospitals (name, slug, address, city, phone, email, timezone) values
  ('City General Hospital', 'city-general', '12 Mall Road', 'Lahore', '+92-42-111-000-111', 'info@citygeneral.example', 'Asia/Karachi'),
  ('Metro Care Hospital', 'metro-care', '45 Clifton Ave', 'Karachi', '+92-21-111-000-222', 'info@metrocare.example', 'Asia/Karachi')
on conflict (slug) do nothing;

insert into public.departments (hospital_id, name, description)
select h.id, d.name, d.description
from public.hospitals h
cross join (values
  ('General Medicine', 'Outpatient general medicine'),
  ('Cardiology', 'Heart care unit'),
  ('Dermatology', 'Skin clinic'),
  ('Neurology', 'Neurology department'),
  ('Pediatrics', 'Children''s health'),
  ('Orthopedics', 'Bone and joint care')
) as d(name, description)
where h.slug in ('city-general', 'metro-care')
on conflict (hospital_id, name) do nothing;

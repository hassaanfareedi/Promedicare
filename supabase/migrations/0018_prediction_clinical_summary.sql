-- ProMediCare AI — store lazy-generated clinician brief on predictions.
alter table public.predictions
  add column if not exists clinical_summary text;

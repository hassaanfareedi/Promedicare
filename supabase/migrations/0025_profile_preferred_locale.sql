-- Preferred UI locale for signed-in users (en | ur). Cookie still drives guests.
alter table public.profiles
  add column if not exists preferred_locale text not null default 'en';

alter table public.profiles
  drop constraint if exists profiles_preferred_locale_check;

alter table public.profiles
  add constraint profiles_preferred_locale_check
  check (preferred_locale in ('en', 'ur'));

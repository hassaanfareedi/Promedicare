# ProMediCare AI

AI-assisted early disease-risk screening, specialist matching and appointment management — built as a production-grade, multi-tenant healthcare SaaS.

> Decision support only — ProMediCare AI is not a medical diagnosis and does not replace consultation with a licensed medical professional.

## Demo

<!-- LIVE_URL -->
Live demo: [https://promedicare.vercel.app](https://promedicare.vercel.app)

For a full walkthrough of every portal, use the demo logins below after seeding (or on the live deploy if demo data is present).

## What it does

ProMediCare AI connects six roles on one secure platform:

- Visitor — marketing site with a smooth preloader, plus a secure public record lookup (Patient ID + a second verification factor, rate limited).
- Patient — onboarding, AI symptom screening with a plain-language risk read, specialist matching, appointment booking, reschedule/cancel, screening history and profile. In-app notifications for booking and screening review.
- Doctor — daily schedule, patient list, AI screening review (with clinical brief), consult notes, and appointment status control.
- Receptionist — walk-in registration, check-in queue (consultation fee), hospital appointments and patient directory.
- Hospital Admin — departments, doctors (create or link) and availability, staff roles, appointments and analytics.
- Super Admin — hospitals, global specialties, hospital-admin assignment, platform analytics, audit logs and settings.

## Tech stack

- Framework: Next.js 15 (App Router, React 19, TypeScript strict)
- UI: Tailwind CSS v4, shadcn (Base UI), Framer Motion, Lucide, Sonner, Recharts
- Forms + validation: React Hook Form + Zod
- Backend: Supabase (PostgreSQL, Row-Level Security, Auth)
- AI: Groq (OpenAI-compatible), JSON-only structured output validated with Zod
- Testing: Playwright end-to-end suite
- Animated marketing components inspired by [Vengeance UI](https://www.vengenceui.com/)

## Architecture highlights

- Defense-in-depth RBAC enforced at three layers: middleware, server actions (`requireRole`) and Postgres RLS.
- Multi-tenancy: every domain row carries `hospital_id`; Hospital Admins are scoped to one hospital, Super Admin spans all.
- AI safety: a single server-only Groq choke point requests JSON, validates with Zod and always falls back to a safe placeholder — the model never returns a diagnosis, and every screening is logged for clinician review.
- Concurrency: double-booking is prevented at the database level with a GiST exclusion constraint, not just in the UI.
- Secure visitor lookup runs through a locked-down `SECURITY DEFINER` RPC returning only a minimal, non-sensitive DTO.

## Getting started

### 1. Prerequisites

- Node.js 20.6+ (uses `--env-file`)
- A Supabase project and a Groq API key

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only: seed script + admin "New doctor"
GROQ_API_KEY=...
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

On Vercel production, set the same variables (including `SUPABASE_SERVICE_ROLE_KEY` so hospital admins can create doctor accounts) and `NEXT_PUBLIC_SITE_URL=https://promedicare.vercel.app` so OAuth and password-reset redirects return to the correct host.

### 3. Google sign-in (optional)

The **Continue with Google** button calls Supabase OAuth. Enable it once:

1. **Google Cloud Console** → APIs & Services → Credentials → Create OAuth client (Web application).  
   Authorized redirect URI (Supabase callback):  
   `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`  
   Example for this project: `https://dzczqdndnuwtirdtavmn.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Authentication → Providers → **Google** → Enable → paste Client ID and Client Secret → Save.
3. **Supabase** → Authentication → URL Configuration:  
   - Site URL: `https://promedicare.vercel.app` (production) or `http://localhost:3000` (local)  
   - Redirect URLs (add both):  
     `https://promedicare.vercel.app/auth/callback`  
     `http://localhost:3000/auth/callback`
4. Redeploy Vercel after setting `NEXT_PUBLIC_SITE_URL`.

Until the provider is enabled, the button still works in the UI but shows a clear configuration error toast.

### 4. Install and run

```bash
npm install
npm run dev
```

Database migrations live in `supabase/migrations/` and must be applied to your Supabase project (Dashboard SQL or Supabase MCP/CLI).

### 5. Seed demo data

```bash
npm run seed
```

This creates confirmed demo logins and enough data for every screen to render. Requires `SUPABASE_SERVICE_ROLE_KEY`.

## Demo logins

All accounts share the password `Promedicare#2026`.

| Role           | Email                          |
| -------------- | ------------------------------ |
| Super Admin    | superadmin@promedicare.test    |
| Hospital Admin | admin@promedicare.test         |
| Doctor         | doctor@promedicare.test        |
| Receptionist   | reception@promedicare.test     |
| Patient        | patient@promedicare.test       |

Public record lookup: `PMC-200001` with DOB `1990-05-14` (or phone `+15551230001`).

## Testing

A Playwright suite covers the main flows for each role and the public visitor lookup.

```bash
npm run test:e2e         # headless run (starts the app automatically)
npm run test:e2e:ui      # interactive UI mode
npm run test:e2e:report  # open the last HTML report
```

To run against a deployed URL:

```bash
PLAYWRIGHT_BASE_URL=https://<your-app>.vercel.app npm run test:e2e
```

## Scripts

| Script                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the dev server                           |
| `npm run build`        | Production build                               |
| `npm run start`        | Serve the production build                      |
| `npm run lint`         | Lint                                           |
| `npm run seed`         | Seed demo logins and data (needs service role) |
| `npm run test:e2e`     | Run the Playwright suite                        |

## Security notes

- The Supabase service-role key is **server-only**: used by the seed script and by hospital-admin doctor account creation (`createAdminClient`). Never expose it to the client.
- Row-Level Security governs every table; the app relies on policies rather than trusting the client.
- Public lookup is rate limited and returns generic errors to prevent Patient ID enumeration.
- Notifications are **in-app** (with Realtime). Auth confirmation / password-reset emails are handled by Supabase Auth — there is no separate appointment-reminder email/SMS pipeline.

---

Built with Next.js, Supabase and Groq. Decision support only — not a medical diagnosis.

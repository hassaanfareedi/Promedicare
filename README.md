# ProMediCare AI

AI-assisted early disease-risk screening, specialist matching and appointment management — built as a production-grade, multi-tenant healthcare SaaS.

> Decision support only — ProMediCare AI is not a medical diagnosis and does not replace consultation with a licensed medical professional.

## Demo

<video src="https://raw.githubusercontent.com/hassaanfareedi/Promedicare/main/public/demo.webm" controls width="100%"></video>

If the player above doesn't load, [watch the demo video](public/demo.webm).

<!-- LIVE_URL -->
Live demo: _deployment in progress_

## What it does

ProMediCare AI connects six roles on one secure platform:

- Visitor — modern marketing site with a smooth preloader, plus a secure public record lookup (Patient ID + a second verification factor, rate limited).
- Patient — onboarding, AI symptom screening with a plain-language risk read, specialist matching, appointment booking, reschedule/cancel, screening history and profile.
- Doctor — daily schedule, patient list, AI screening review with outcomes, and appointment status control.
- Receptionist — walk-in registration, check-in/out queue, hospital appointments and patient directory.
- Hospital Admin — departments, doctors and availability, staff roles, appointments and analytics.
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
SUPABASE_SERVICE_ROLE_KEY=...      # server-only, used by the seed script
GROQ_API_KEY=...
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install and run

```bash
npm install
npm run dev
```

Database migrations live in `supabase/migrations/` and are applied to the Supabase project.

### 4. Seed demo data

```bash
npm run seed
```

This creates six confirmed demo logins and enough data for every screen to render.

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

A Playwright suite covers every role's flows, buttons and the public visitor lookup.

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

- The Supabase service-role key is used only by local/CI scripts and is never shipped to the client.
- Row-Level Security governs every table; the app relies on policies rather than trusting the client.
- Public lookup is rate limited and returns generic errors to prevent Patient ID enumeration.

---

Built with Next.js, Supabase and Groq. Decision support only — not a medical diagnosis.

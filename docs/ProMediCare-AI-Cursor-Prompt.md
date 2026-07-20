# ProMediCare AI — Master Build Prompt (Cursor Edition)

## Role

You are acting as a Senior Software Architect, Full-Stack Engineer, Database Architect, UI/UX Designer, AI Integration Engineer, DevOps Engineer, and Code Reviewer — all at once — inside Cursor.

You have direct, live access to my project infrastructure through connected MCP tools:

- **Supabase MCP** — you can inspect and modify the live database schema, run migrations, write RLS policies, and query data directly. Never guess at schema — check it via MCP before writing code that touches it.
- **GitHub MCP** — you can create branches, commit, open PRs, and read repo history directly. Use proper commit messages and keep the working tree clean per module (see Git workflow below).

Use these tools proactively instead of asking me to paste schema, run SQL manually, or copy-paste diffs. If a tool call fails or you lack a permission you need, tell me exactly what to grant instead of working around it silently.

---

## Project

**ProMediCare AI** — an AI-assisted early disease-risk screening, appointment scheduling, and healthcare management platform, built to production-SaaS quality and portfolio-worthy standard.

**Non-negotiable principle:** The AI is decision support only — never a diagnosis. Every patient-facing AI output must show a clear, persistent disclaimer stating the system does not replace a licensed medical professional.

This is being built under real time pressure. The plan and every phase must be realistic to actually ship, not aspirational — no multi-week phases, no gold-plating before the core loop works.

---

## Tech Stack (non-negotiable)

- Next.js 15, App Router, TypeScript (strict, no `any`)
- Tailwind CSS + shadcn/ui as the component foundation
- React Hook Form + Zod for all forms and request validation
- Supabase (PostgreSQL + Row Level Security + Supabase Auth), managed live via Supabase MCP
- **Groq API** for all AI features (see AI Architecture below) — not OpenAI/Anthropic directly
- Framer Motion (subtle use), Recharts (analytics), Sonner (toasts), Lucide Icons
- Server Components by default; Client Components only where interactivity requires it
- Feature-based architecture: UI, business logic, data access, hooks, schemas, and types stay in separate, clearly bounded files — never mixed in one blob

---

## AI Architecture — Groq

All AI-powered features (symptom-based disease risk prediction, confidence scoring, risk classification, explainability text, specialist recommendation reasoning, AI-generated patient summaries) are powered by **Groq's API** (OpenAI-compatible chat completions endpoint, `https://api.groq.com/openai/v1`), not a direct LLM SDK.

Requirements for the AI layer:

- Isolate all Groq calls behind a single server-side service module (e.g. `lib/ai/groq-client.ts`) — no client-side calls, no API key ever shipped to the browser.
- Use structured output: prompt the model to return **JSON only**, validate the response server-side with a Zod schema before it touches the database or UI. Never trust raw model output.
- Every prediction response must include: predicted condition(s), a confidence score, a risk level (low/medium/high/urgent), a plain-language explanation, and a recommended specialist type.
- Wrap every Groq call in error handling with a sane fallback (e.g. "unable to generate a recommendation right now") — never let an AI failure break appointment booking or block the UI.
- Log every prediction (input symptoms, model output, model/version used, timestamp) to a `predictions` table for history, audit, and analytics — this is required for the Doctor Portal's "AI Prediction Review" and for trend analytics later.
- The disclaimer is rendered by the UI layer, always, regardless of what the model returns — never rely on the model to self-disclaim.
- Pick a fast Groq model suited to structured JSON extraction (e.g. a Llama 3.x or similar low-latency model available on Groq) and keep the model name in an env var, not hardcoded, so it can be swapped without a code change.

---

## User Roles (six — enforced everywhere)

1. **Visitor** (unauthenticated) — marketing site only
2. **Patient** — health records, AI symptom check, appointment booking
3. **Doctor** — schedule, patient list, AI prediction review, consultation notes
4. **Receptionist** — booking, check-in queue, queue management
5. **Hospital Admin** — manages one hospital: staff, departments, appointments, analytics
6. **Super Admin** — manages the whole platform: all hospitals, global config, global analytics

Role-Based Access Control (RBAC) must be enforced at every layer simultaneously: page-level (middleware/layout guards), API-route level, and database level (Supabase RLS policies). No page or endpoint should ever rely on just one of these layers. Verify RLS policies via Supabase MCP as each table is created — don't assume they're correct, check them.

---

## Foundation — must exist before any feature module starts

Build and verify these before touching a single portal feature:

1. **Database schema v1** (via Supabase MCP): core tables — `users`/`profiles`, `hospitals`, `departments`, `specialties`, `doctors`, `patients`, `appointments`, `predictions`, `notifications`, plus audit/history tables. UUID PKs, FKs, indexes, `created_at`/`updated_at`/`deleted_at` on every table, soft deletes where appropriate.
2. **RLS policies** for every table, scoped per role, written and tested via Supabase MCP before any app code queries them.
3. **Auth flow end-to-end**: email + Google login, registration, email verification, password reset, session handling, role assignment, profile completion gate.
4. **Global types & Zod schemas** shared across the app (`types/`, `schemas/`) generated from or matched to the real DB schema.
5. **Shared UI shell**: app layout, role-aware navigation, the persistent progress-bar/stepper component (used in symptom intake, booking, onboarding), loading skeletons, empty states, error boundaries — built as reusable shadcn/ui-based components, not per-page one-offs.
6. **Groq client module** (`lib/ai/groq-client.ts`) with a working "hello world" structured-output call, verified before any real prediction feature is built on top of it.

Nothing else starts until these six are working and committed.

---

## Build Sequence (phased, urgent timeline)

**Phase 1 — Core loop (MVP)**
Foundation (above) → Auth → Patient Portal core (profile, symptom entry, AI prediction with disclaimer, specialist recommendation) → Appointment booking (patient side) → Doctor Portal core (schedule, patient list, prediction review) → basic notifications (in-app for booking/confirmation).
*Goal: a patient can register, describe symptoms, get an AI-assisted risk read with disclaimer, get matched to a specialist, and book an appointment a doctor can see.*

**Phase 2 — Operational roles**
Receptionist Portal (walk-in registration, check-in queue, queue management, doctor availability) → Hospital Admin Portal (manage users, doctors, departments, appointments) → richer notifications (realtime in-app) → rescheduling/cancellation flows across all roles.

**Phase 3 — Platform layer & polish**
Super Admin Portal (hospitals, global config, feature flags, platform analytics) → Analytics & Reporting across all portals (charts, CSV/PDF export) → audit logs/system logs → Marketing site (can be built in parallel by a second track if time allows, since it has no dependency on the app shell) → dark mode, accessibility pass, performance pass (image optimization, caching, pagination, code splitting).

**Parallelizable at any point:** Marketing website (fully independent of the authenticated app), notification templates, and analytics chart components can be built alongside whichever portal is active, since they don't block or get blocked by the core loop.

---

## Risk & Complexity Flags (address early, not at the end)

- **RLS correctness** for six roles across a dozen+ tables is the highest-risk area — a wrong policy either leaks data or silently blocks legitimate access. Test each policy with real role-scoped queries via Supabase MCP as you write it, not after.
- **Groq structured-output reliability** — LLMs occasionally return malformed JSON. The Zod-validation + fallback path must be solid before any UI depends on it, or a bad response will surface as a broken page instead of a graceful message.
- **Appointment/queue concurrency** (double-booking, race conditions on slot booking) needs explicit handling (DB constraints/transactions), not just UI-level prevention.
- **Six-role navigation/permission matrix** is a lot of surface area — build the role-guard pattern once, reuse it everywhere, don't hand-roll per-page checks.

---

## Git Workflow (via GitHub MCP)

- One feature/module per branch, one focused PR per module — matches the "one module at a time, fully complete" rule below.
- Commit messages describe the module and layer touched (e.g. `feat(patient-portal): symptom intake form + Zod schema`).
- Don't touch unrelated files in a module's PR.
- Open the PR against `main` (or the branch I specify) via MCP rather than asking me to do it manually.

---

## Development Rules

1. Build **one module at a time**, in the sequence above — never attempt multiple modules simultaneously.
2. Each module must ship **complete**: UI, validation, API/data layer, RLS check, error/loading/empty states — no partial files, no unexplained placeholders.
3. Every new module follows the architecture, naming, and patterns already established — check existing code before introducing a new pattern.
4. Security, accessibility (WCAG 2.1), and RBAC correctness are checked **as part of** building each module, not as a later pass.
5. Before coding a module, briefly state: what tables/RLS it touches, what it depends on, and what it unblocks. Flag if a better architectural approach exists before writing code.
6. Use Supabase MCP to verify schema/RLS state and GitHub MCP to manage branches/commits — don't ask me to do either manually unless a tool call fails.

---

## Ready

Confirm the foundation task list above, then start with Phase 1, Step 1: database schema + RLS design via Supabase MCP. State your proposed schema and policies before writing any application code against them.

import Link from "next/link";
import {
  Activity,
  Brain,
  CalendarCheck,
  ShieldCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { Preloader } from "@/components/marketing/preloader";
import { SpotlightNav } from "@/components/marketing/spotlight-nav";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import { AnimatedHeading } from "@/components/marketing/animated-heading";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { Reveal } from "@/components/marketing/reveal";
import { VisitorLookup } from "@/features/visitor/components/visitor-lookup";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { Logo } from "@/components/brand/logo";

const STATS = [
  { value: "6", label: "Connected roles" },
  { value: "<3s", label: "AI screening" },
  { value: "24/7", label: "Record lookup" },
  { value: "100%", label: "RLS-protected" },
];

const STEPS = [
  {
    icon: Activity,
    title: "Describe your symptoms",
    body: "Enter what you're experiencing through a simple, guided form — no medical jargon required.",
  },
  {
    icon: Brain,
    title: "Get an AI risk read",
    body: "Our AI screens your symptoms, estimates a risk level and explains its reasoning in plain language.",
  },
  {
    icon: CalendarCheck,
    title: "See the right specialist",
    body: "We recommend a specialist and let you book an appointment that your doctor can review instantly.",
  },
];

const FEATURES = [
  { icon: Brain, title: "AI symptom screening", body: "Fast, structured risk assessment powered by Groq — decision support, never a diagnosis." },
  { icon: Stethoscope, title: "Specialist matching", body: "Automatically routed to the most relevant specialty for your symptoms." },
  { icon: CalendarCheck, title: "Effortless booking", body: "Real-time slots with no double-booking, plus reminders and easy rescheduling." },
  { icon: ShieldCheck, title: "Privacy by design", body: "Row-level security and least-privilege access protect every record." },
  { icon: Building2, title: "Multi-hospital", body: "Built for many hospitals with role-based portals for every kind of user." },
  { icon: Sparkles, title: "Doctor-in-the-loop", body: "Every AI screening is logged for clinicians to review and act on." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const homeHref = user ? ROLE_HOME[user.profile.role] : "/login";

  return (
    <>
      <Preloader />
      <div className="flex min-h-svh flex-col">
        <SpotlightNav isAuthed={Boolean(user)} homeHref={homeHref} />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <AuroraBackground />
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:px-6 lg:grid-cols-2 lg:py-24">
            <div className="flex flex-col justify-center">
              <Reveal>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300">
                  <Sparkles className="size-3.5" /> AI-assisted early screening
                </span>
              </Reveal>
              <AnimatedHeading
                lead="Understand your symptoms."
                accent="See the right doctor, sooner."
                className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl"
              />
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
                  ProMediCare AI screens your symptoms for early disease risk, matches you to a
                  specialist and books your appointment — all in one secure platform.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={user ? homeHref : "/register"} className={buttonVariants({ size: "lg" })}>
                    {user ? "Go to dashboard" : "Start free screening"}
                    <ArrowRight className="size-4" />
                  </Link>
                  <a href="#lookup" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Look up a record
                  </a>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-teal-600" />
                  Decision support only — not a medical diagnosis.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="flex items-center">
              <div id="lookup" className="w-full scroll-mt-24">
                <VisitorLookup />
              </div>
            </Reveal>
          </div>

          {/* Stats band */}
          <div className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
            <Reveal delay={0.15}>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label} className="bg-card px-4 py-5 text-center">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <span className="block text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
                        {s.value}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{s.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
                <p className="mt-3 text-muted-foreground">Three simple steps from symptom to specialist.</p>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08}>
                  <div className="relative h-full rounded-2xl border bg-card p-6">
                    <div className="mb-4 grid size-11 place-items-center rounded-xl bg-teal-600 text-white">
                      <step.icon className="size-5" />
                    </div>
                    <span className="absolute right-6 top-6 text-3xl font-bold text-muted-foreground/15">
                      {i + 1}
                    </span>
                    <h3 className="text-lg font-medium">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1}>
              <div className="mx-auto mt-10 max-w-3xl">
                <AiDisclaimer />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight">Everything in one platform</h2>
                <p className="mt-3 text-muted-foreground">
                  For patients, doctors, receptionists and administrators.
                </p>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 0.06}>
                  <SpotlightCard>
                    <div className="mb-4 grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-600 transition-transform group-hover:scale-110 dark:bg-teal-950/50 dark:text-teal-400">
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-gradient-to-br from-teal-600 to-emerald-700 py-16 text-white md:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Take charge of your health today
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Create a free account and get your first AI-assisted screening in minutes.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href={user ? homeHref : "/register"}
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  {user ? "Go to dashboard" : "Get started free"}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="border-t py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row md:px-6">
            <Logo size="sm" />
            <p>© {new Date().getFullYear()} ProMediCare AI. Decision support only — not a diagnosis.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

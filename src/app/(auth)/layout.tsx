import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AI_DISCLAIMER } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <main id="main-content" className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="mx-auto max-w-sm text-center text-xs text-muted-foreground">
          {AI_DISCLAIMER}
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 lg:block">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_20%,white,transparent_35%),radial-gradient(circle_at_70%_70%,white,transparent_35%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="space-y-3">
            <p className="text-2xl font-medium leading-snug">
              &ldquo;Early awareness saves lives. ProMediCare AI helps you understand your
              symptoms and connect with the right specialist &mdash; faster.&rdquo;
            </p>
            <footer className="text-sm text-white/80">
              AI-assisted screening &middot; Decision support, not diagnosis
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

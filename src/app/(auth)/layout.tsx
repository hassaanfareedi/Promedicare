import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
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
      <AuthVisualPanel />
    </div>
  );
}

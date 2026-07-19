import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { VisitorLookup } from "@/features/visitor/components/visitor-lookup";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Look up your record",
  description: "Securely view your appointment status and basic history with your Patient ID.",
};

export default function RecordsPage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-10">
        <PageHeader
          hero
          className="mb-6"
          title="Patient record lookup"
          description="Check your appointment status and recent visit history without signing in."
        />
        <VisitorLookup />
        <AiDisclaimer className="mt-6" compact />
      </main>
    </div>
  );
}

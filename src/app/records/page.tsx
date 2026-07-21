import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { VisitorLookup } from "@/features/visitor/components/visitor-lookup";
import { AiDisclaimer } from "@/components/shared/ai-disclaimer";
import { PageHeader } from "@/components/shared/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("visitor");
  return { title: t("title") };
}

export default async function RecordsPage() {
  const t = await getTranslations("visitor");

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
          title={t("title")}
          description={t("subtitle")}
        />
        <VisitorLookup />
        <AiDisclaimer className="mt-6" compact />
      </main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared error UI for portal route boundaries (renders inside the AppShell). */
export function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[50vh] place-items-center px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        <Button onClick={reset} className="mt-6">
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}

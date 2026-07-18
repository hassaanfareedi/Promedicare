import type { Metadata } from "next";
import { CheckCircle2, XCircle, Sparkles, ShieldCheck } from "lucide-react";
import { isGroqConfigured } from "@/lib/ai/groq-client";
import { APP_NAME } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default function PlatformSettingsPage() {
  const aiReady = isGroqConfigured();

  return (
    <div className="space-y-6">
      <PageHeader title="Platform settings" description="System configuration and status." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-teal-600" /> AI screening
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Groq-powered symptom screening {aiReady ? "is configured and active." : "is not configured."}
          </p>
          {aiReady ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="size-4" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <XCircle className="size-4" /> Not configured
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-teal-600" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Row-level security is enforced on every table with per-role policies.</p>
          <p>Public record lookup requires a Patient ID plus a second verification factor and is rate limited.</p>
          <p>All privileged actions are recorded in the audit log.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{APP_NAME} — AI-assisted early disease-risk screening and healthcare management.</p>
          <p className="mt-1">Decision support only — not a medical diagnosis.</p>
        </CardContent>
      </Card>
    </div>
  );
}

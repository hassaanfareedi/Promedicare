"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlatformAnalytics } from "@/features/platform/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRiskTone } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";

const RISK_KEYS = new Set(["low", "medium", "high", "urgent"]);

/** Popover-token tooltip so charts read correctly in dark mode. */
const CHART_TOOLTIP = {
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  fontSize: 12,
  backgroundColor: "var(--color-popover)",
  color: "var(--color-popover-foreground)",
} as const;
const CHART_TOOLTIP_TEXT = { color: "var(--color-popover-foreground)" } as const;
const HOSPITAL_XAXIS = {
  dataKey: "hospital",
  tickLine: false,
  axisLine: false,
  fontSize: 12,
  interval: 0,
  angle: -30,
  textAnchor: "end" as const,
  height: 60,
};

export function PlatformAnalyticsView({ analytics }: { analytics: PlatformAnalytics }) {
  const t = useTranslations("platform");
  const tRoles = useTranslations("roles");
  const tRisk = useTranslations("risk");
  const tPatient = useTranslations("patient");

  function exportCsv() {
    const rows = [
      ...analytics.perHospital.map((h) => ({ metric: "appointments", key: h.hospital, value: h.count })),
      ...analytics.riskCounts.map((r) => ({ metric: "risk", key: r.level, value: r.count })),
      ...analytics.roleCounts.map((r) => ({ metric: "role", key: r.role, value: r.count })),
    ];
    downloadCsv(`promedicare-analytics-${new Date().toISOString().slice(0, 10)}`, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("totalFeeIncome")}{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {Math.round(analytics.totalIncome).toLocaleString()} {t("pkr")}
          </span>
        </p>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-4" /> {t("exportCsv")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("feeIncomeByHospital")}</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.incomeByHospital.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFees")}</p>
          ) : (
            <div className="h-72 w-full">
              <p className="sr-only">
                {t("feeIncomeByHospitalSr", {
                  values: analytics.incomeByHospital
                    .map((h) => `${h.hospital}: ${Math.round(h.amount).toLocaleString()}`)
                    .join(", "),
                })}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={analytics.incomeByHospital} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis {...HOSPITAL_XAXIS} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={CHART_TOOLTIP_TEXT}
                    labelStyle={CHART_TOOLTIP_TEXT}
                    formatter={(value) => [`${Number(value).toLocaleString()} ${t("pkr")}`, t("income")]}
                  />
                  <Bar dataKey="amount" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("appointmentsByHospital")}</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.perHospital.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tPatient("noAppointments")}</p>
          ) : (
            <div className="h-72 w-full">
              <p className="sr-only">
                {t("appointmentsByHospitalSr", {
                  values: analytics.perHospital.map((h) => `${h.hospital}: ${h.count}`).join(", "),
                })}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={analytics.perHospital} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis {...HOSPITAL_XAXIS} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={CHART_TOOLTIP_TEXT}
                    labelStyle={CHART_TOOLTIP_TEXT}
                  />
                  <Bar dataKey="count" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("usersByRole")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.roleCounts.map((r) => (
                <li key={r.role} className="flex items-center justify-between text-sm">
                  <span>{tRoles(r.role)}</span>
                  <span className="tabular-nums text-muted-foreground">{r.count}</span>
                </li>
              ))}
              {analytics.roleCounts.length === 0 && <p className="text-sm text-muted-foreground">{t("noUsers")}</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("riskDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.riskCounts.map((r) => (
                <li key={r.level} className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRiskTone(r.level)}`}
                  >
                    {tRisk(RISK_KEYS.has(r.level) ? r.level : "unknown")}
                  </span>
                  <span className="tabular-nums text-sm text-muted-foreground">{r.count}</span>
                </li>
              ))}
              {analytics.riskCounts.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("noScreenings")}</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

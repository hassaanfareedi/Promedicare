"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminAnalytics } from "@/features/admin/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentStatusMeta, getRiskMeta } from "@/lib/constants";

function weekdayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

/** Popover-token tooltip so charts read correctly in dark mode. */
const CHART_TOOLTIP = {
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  fontSize: 12,
  backgroundColor: "var(--color-popover)",
  color: "var(--color-popover-foreground)",
} as const;
const CHART_TOOLTIP_TEXT = { color: "var(--color-popover-foreground)" } as const;

export function AnalyticsCharts({ analytics }: { analytics: AdminAnalytics }) {
  const trend = analytics.weeklyTrend.map((t) => ({ label: weekdayLabel(t.date), count: t.count }));
  const income = analytics.incomeTrend.map((t) => ({
    label: weekdayLabel(t.date),
    amount: t.amount,
  }));
  const hasTrend = trend.some((t) => t.count > 0);
  const hasIncome = income.some((t) => t.amount > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Appointments — next 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="h-64 w-full">
              <p className="sr-only">
                Appointments per day for the next 7 days:{" "}
                {trend.map((t) => `${t.label}: ${t.count}`).join(", ")}.
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
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
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No appointments in the next 7 days.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Fee income — last 7 days (PKR)</CardTitle>
        </CardHeader>
        <CardContent>
          {hasIncome ? (
            <div className="h-64 w-full">
              <p className="sr-only">
                Fee income per day for the last 7 days (PKR):{" "}
                {income.map((t) => `${t.label}: ${t.amount.toLocaleString()}`).join(", ")}.
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={income} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    contentStyle={CHART_TOOLTIP}
                    itemStyle={CHART_TOOLTIP_TEXT}
                    labelStyle={CHART_TOOLTIP_TEXT}
                    formatter={(value) => [`${Number(value).toLocaleString()} PKR`, "Income"]}
                  />
                  <Bar dataKey="amount" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No fee income in the last 7 days.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointments by status</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.statusCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.statusCounts.map((s) => {
                const pct = Math.round((s.count / Math.max(analytics.totalAppointments, 1)) * 100);
                const label = getAppointmentStatusMeta(s.status).label;
                return (
                  <li key={s.status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="tabular-nums text-muted-foreground">{s.count}</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`${label}: ${s.count} appointments (${pct}%)`}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screening risk distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.riskCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No screenings yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.riskCounts.map((r) => (
                <li key={r.level} className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRiskMeta(r.level).tone}`}
                  >
                    {getRiskMeta(r.level).label}
                  </span>
                  <span className="tabular-nums text-sm text-muted-foreground">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

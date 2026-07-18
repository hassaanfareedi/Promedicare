"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminAnalytics } from "@/features/admin/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPOINTMENT_STATUS_META, RISK_META } from "@/lib/constants";

function weekdayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function AnalyticsCharts({ analytics }: { analytics: AdminAnalytics }) {
  const trend = analytics.weeklyTrend.map((t) => ({ label: weekdayLabel(t.date), count: t.count }));
  const income = analytics.incomeTrend.map((t) => ({
    label: weekdayLabel(t.date),
    amount: t.amount,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Appointments — next 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }}
                />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Fee income — last 7 days (PKR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={income} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }}
                  formatter={(value) => [`${Number(value).toLocaleString()} PKR`, "Income"]}
                />
                <Bar dataKey="amount" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                return (
                  <li key={s.status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{APPOINTMENT_STATUS_META[s.status].label}</span>
                      <span className="tabular-nums text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
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
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_META[r.level].tone}`}
                  >
                    {RISK_META[r.level].label}
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

"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import type { PlatformAnalytics } from "@/features/platform/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RISK_META, ROLE_LABEL } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";

export function PlatformAnalyticsView({ analytics }: { analytics: PlatformAnalytics }) {
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
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointments by hospital</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.perHospital.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.perHospital} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="hospital" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }}
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
            <CardTitle className="text-base">Users by role</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.roleCounts.map((r) => (
                <li key={r.role} className="flex items-center justify-between text-sm">
                  <span>{ROLE_LABEL[r.role]}</span>
                  <span className="tabular-nums text-muted-foreground">{r.count}</span>
                </li>
              ))}
              {analytics.roleCounts.length === 0 && <p className="text-sm text-muted-foreground">No users yet.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Screening risk distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
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
              {analytics.riskCounts.length === 0 && (
                <p className="text-sm text-muted-foreground">No screenings yet.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

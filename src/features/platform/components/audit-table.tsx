"use client";

import { Download } from "lucide-react";
import type { AuditEntry } from "@/features/platform/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  function exportCsv() {
    downloadCsv(
      `promedicare-audit-${new Date().toISOString().slice(0, 10)}`,
      entries.map((e) => ({
        time: e.created_at,
        action: e.action,
        entity_type: e.entity_type ?? "",
        entity_id: e.entity_id ?? "",
        actor: e.actor?.full_name ?? e.actor?.email ?? "system",
      })),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={entries.length === 0}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden sm:table-cell">Entity</TableHead>
                <TableHead className="hidden md:table-cell">Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(e.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{e.action}</TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">{e.entity_type ?? "—"}</TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {e.actor?.full_name ?? e.actor?.email ?? "system"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

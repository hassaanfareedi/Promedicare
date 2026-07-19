"use client";

import { useState } from "react";
import { FileText, Printer } from "lucide-react";
import type { MedicalVisit } from "@/features/clinical/data";
import { AttachmentLink } from "@/features/clinical/components/attachment-link";
import { PrescriptionPrintView } from "@/features/clinical/components/prescription-print";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatDoctorName } from "@/lib/format";
import type { AppointmentStatus } from "@/types";

export function MedicalFileTable({
  visits,
  patientName,
  patientCode,
}: {
  visits: MedicalVisit[];
  patientName: string;
  patientCode?: string | null;
}) {
  const [rx, setRx] = useState<MedicalVisit | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Diagnosis</TableHead>
            <TableHead className="hidden md:table-cell">Summary</TableHead>
            <TableHead>Rx</TableHead>
            <TableHead className="hidden sm:table-cell">Files</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((v) => (
            <TableRow key={v.appointmentId}>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{formatDateTime(v.scheduledStart)}</p>
                  <StatusBadge status={v.status as AppointmentStatus} />
                  {v.doctorName && (
                    <p className="text-xs text-muted-foreground">{formatDoctorName(v.doctorName)}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[12rem] whitespace-normal text-sm">
                {v.diagnosis ?? "—"}
              </TableCell>
              <TableCell className="hidden max-w-xs whitespace-normal text-sm text-muted-foreground md:table-cell">
                {v.assessment || v.subjective
                  ? (v.assessment ?? v.subjective)?.slice(0, 120)
                  : "—"}
              </TableCell>
              <TableCell>
                {v.prescription || v.medications.length > 0 ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setRx(v)}>
                    <FileText className="size-3.5" /> View
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {v.attachments.length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  <ul className="space-y-1">
                    {v.attachments.map((a) => (
                      <li key={a.id}>
                        <AttachmentLink id={a.id} fileName={a.file_name} />
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(rx)} onOpenChange={(o) => !o && setRx(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription</DialogTitle>
          </DialogHeader>
          {rx && (
            <PrescriptionPrintView
              patientName={patientName}
              patientCode={patientCode}
              doctorName={rx.doctorName ?? "Doctor"}
              diagnosis={rx.diagnosis ?? "—"}
              prescription={rx.prescription ?? ""}
              medications={rx.medications}
              date={rx.scheduledStart}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

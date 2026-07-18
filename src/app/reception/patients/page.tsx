import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getHospitalPatients } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { WalkInDialog } from "@/features/reception/components/walk-in-dialog";

export const metadata: Metadata = { title: "Patients" };

export default async function ReceptionPatientsPage() {
  const patients = await getHospitalPatients();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Registered patients at your hospital."
        actions={<WalkInDialog />}
      />
      {patients.length === 0 ? (
        <EmptyState icon={Users} title="No patients yet" description="Register a walk-in to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Date of birth</TableHead>
                  <TableHead className="hidden md:table-cell">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.patient_code}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.phone ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(p.dob)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(p.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

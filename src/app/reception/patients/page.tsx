import type { Metadata } from "next";
import Link from "next/link";
import { Users, CalendarPlus } from "lucide-react";
import { getHospitalPatients, getWalkInDoctors } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
  const [patients, doctors] = await Promise.all([getHospitalPatients(), getWalkInDoctors()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Registered patients at your hospital."
        actions={
          <>
            <Link
              href="/reception/appointments/new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <CalendarPlus className="size-4" aria-hidden /> Book appointment
            </Link>
            <WalkInDialog doctors={doctors} />
          </>
        }
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <Link
                        href={`/reception/appointments/new?patient=${p.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <CalendarPlus className="size-4" aria-hidden /> Book
                      </Link>
                    </TableCell>
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

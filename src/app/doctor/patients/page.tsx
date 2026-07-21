import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDoctorPatients } from "@/features/doctor/data";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doctor");
  return { title: t("patientsTitle") };
}

export default async function DoctorPatientsPage() {
  const t = await getTranslations("doctor");
  const patients = await getDoctorPatients();

  return (
    <div className="space-y-8">
      <PageHeader title={t("patientsTitle")} description={t("patientsDesc")} />

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients yet"
          description="Hospital patients will appear here once they are registered."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  <TableHead className="hidden sm:table-cell">Date of birth</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/doctor/patients/${p.id}`}
                        className="text-brand hover:underline"
                      >
                        {p.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.patient_code}</TableCell>
                    <TableCell className="hidden capitalize sm:table-cell">
                      {p.gender?.replace(/_/g, " ") ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(p.dob)}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.phone ?? "—"}</TableCell>
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

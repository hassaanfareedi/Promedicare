import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDoctorPatients } from "@/features/doctor/data";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
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
          title={t("noPatientsTitle")}
          description={t("noPatientsDesc")}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("colPatientId")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("colGender")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("colDob")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("colPhone")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <ReliableNavLink
                        href={`/doctor/patients/${p.id}`}
                        className="text-brand hover:underline"
                      >
                        {p.full_name}
                      </ReliableNavLink>
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

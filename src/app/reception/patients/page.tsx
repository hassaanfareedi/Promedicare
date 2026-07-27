import type { Metadata } from "next";
import { Users, CalendarPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getHospitalPatients, getWalkInDoctors } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reception");
  return { title: t("patientsTitle") };
}

export default async function ReceptionPatientsPage() {
  const t = await getTranslations("reception");
  const [patients, doctors] = await Promise.all([getHospitalPatients(), getWalkInDoctors()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("patientsTitle")}
        description={t("patientsDesc")}
        actions={
          <>
            <LinkButton href="/reception/appointments/new" variant="outline" size="sm">
              <CalendarPlus className="size-4" aria-hidden /> {t("bookAppointment")}
            </LinkButton>
            <WalkInDialog doctors={doctors} />
          </>
        }
      />
      {patients.length === 0 ? (
        <EmptyState icon={Users} title={t("noPatients")} description={t("noPatientsDesc")} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("patientId")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("phone")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dob")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("registered")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
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
                      <LinkButton
                        href={`/reception/appointments/new?patient=${p.id}`}
                        variant="outline"
                        size="sm"
                      >
                        <CalendarPlus className="size-4" aria-hidden /> {t("book")}
                      </LinkButton>
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

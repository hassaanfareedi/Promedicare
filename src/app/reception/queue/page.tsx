import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getTodayAppointments, getWalkInDoctors } from "@/features/reception/data";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StaffAppointmentRow } from "@/features/reception/components/staff-appointment-row";
import { WalkInDialog } from "@/features/reception/components/walk-in-dialog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reception");
  return { title: t("queueTitle") };
}

export default async function QueuePage() {
  const t = await getTranslations("reception");
  const [today, doctors] = await Promise.all([getTodayAppointments(), getWalkInDoctors()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("queueTitle")}
        description={t("queueDesc")}
        actions={<WalkInDialog doctors={doctors} />}
      />
      {today.length === 0 ? (
        <EmptyState icon={Clock} title={t("queueEmpty")} description={t("queueEmptyDesc")} />
      ) : (
        <div className="space-y-3">
          {today.map((a) => (
            <StaffAppointmentRow key={a.id} a={a} allowReschedule={false} />
          ))}
        </div>
      )}
    </div>
  );
}

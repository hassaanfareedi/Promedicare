"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, UserCog, UserMinus, Stethoscope, AlertCircle } from "lucide-react";
import { assignRole, demoteToPatient } from "@/features/admin/actions";
import type { AdminStaffMember } from "@/features/admin/data";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/link-button";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSIGNABLE: UserRole[] = ["doctor", "receptionist"];

type RoleFilter = "all" | "doctor" | "receptionist" | "hospital_admin";

function initials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: UserRole }) {
  const tRoles = useTranslations("roles");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        role === "doctor" &&
          "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200",
        role === "receptionist" &&
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
        role === "hospital_admin" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
        role === "super_admin" && "border-border bg-muted text-muted-foreground",
        role === "patient" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {tRoles(role)}
    </span>
  );
}

function StaffCard({ member }: { member: AdminStaffMember }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tRoles = useTranslations("roles");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<string>(member.role);
  const [demoteOpen, setDemoteOpen] = useState(false);
  const [demoting, setDemoting] = useState(false);
  const locked = member.role === "hospital_admin" || member.role === "super_admin";
  const name = member.full_name?.trim() || t("unnamed");
  const email = member.email?.trim() || null;

  function save() {
    startTransition(async () => {
      const res = await assignRole({
        profileId: member.id,
        role: role as "doctor" | "receptionist",
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("roleUpdated"));
      router.refresh();
    });
  }

  async function confirmDemote() {
    setDemoting(true);
    const res = await demoteToPatient({ profileId: member.id });
    if (!res.ok) {
      toast.error(res.error);
      setDemoting(false);
      return;
    }
    toast.success(t("demotedToPatient"));
    setDemoteOpen(false);
    setDemoting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-600/15 text-sm font-semibold text-teal-800 dark:text-teal-200"
            aria-hidden
          >
            {initials(member.full_name, member.email)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{name}</p>
              <RoleBadge role={member.role} />
            </div>
            {email && <p className="truncate text-sm text-muted-foreground">{email}</p>}
            {member.role === "doctor" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {member.hasDoctorProfile ? (
                  <>
                    <Stethoscope className="size-3.5 text-teal-600" aria-hidden />
                    {t("clinicalProfileLinked")}
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3.5 text-amber-600" aria-hidden />
                    {t("needsDoctorsSetup")}{" "}
                    <ReliableNavLink
                      href="/admin/doctors"
                      className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
                    >
                      {t("openDoctors")}
                    </ReliableNavLink>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!locked && (
            <>
              <Select
                value={role}
                onValueChange={(v) => setRole(v ?? "")}
                items={ASSIGNABLE.map((r) => ({ value: r, label: tRoles(r) }))}
              >
                <SelectTrigger className="w-36" aria-label={t("roleFor", { name })}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE.map((r) => (
                    <SelectItem key={r} value={r}>
                      {tRoles(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={save}
                disabled={pending || role === member.role}
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : tc("save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDemoteOpen(true)}
                aria-label={t("demoteName", { name })}
              >
                <UserMinus className="size-4" aria-hidden />
                {t("demote")}
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={demoteOpen} onOpenChange={setDemoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("demoteToPatientTitle")}</DialogTitle>
            <DialogDescription>{t("demoteToPatientDesc", { name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={demoting}
              onClick={() => setDemoteOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="button" disabled={demoting} onClick={() => void confirmDemote()}>
              {demoting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("demoteToPatientConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function StaffManager({
  staff,
  promoteAction,
}: {
  staff: AdminStaffMember[];
  promoteAction: ReactNode;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tRoles = useTranslations("roles");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const doctors = staff.filter((s) => s.role === "doctor").length;
  const receptionists = staff.filter((s) => s.role === "receptionist").length;
  const admins = staff.filter((s) => s.role === "hospital_admin").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((s) => {
        if (roleFilter !== "all" && s.role !== roleFilter) return false;
        if (!q) return true;
        const hay = `${s.full_name ?? ""} ${s.email ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) =>
        (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [staff, query, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("staffSummary", { total: staff.length, doctors, receptionists, admins })}
        </p>
        {promoteAction}
      </div>

      {staff.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            <Label htmlFor="staff-search">{tc("search")}</Label>
            <Input
              id="staff-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or email"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("role")}</Label>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter((v as RoleFilter) ?? "all")}
              items={[
                { value: "all", label: t("allRoles") },
                { value: "doctor", label: tRoles("doctor") },
                { value: "receptionist", label: tRoles("receptionist") },
                { value: "hospital_admin", label: t("admin") },
              ]}
            >
              <SelectTrigger className="w-40" aria-label={t("roleFilter")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allRoles")}</SelectItem>
                <SelectItem value="doctor">{tRoles("doctor")}</SelectItem>
                <SelectItem value="receptionist">{tRoles("receptionist")}</SelectItem>
                <SelectItem value="hospital_admin">{t("admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {staff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={t("noStaffYet")}
          description={t("noStaffYetDesc")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={t("noMatches")}
          description={t("noMatchesRoleDesc")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <StaffCard key={m.id} member={m} />
          ))}
        </div>
      )}

      {staff.some((s) => s.role === "doctor" && !s.hasDoctorProfile) && (
        <p className="text-center text-sm text-muted-foreground">
          {t("someDoctorsNeedProfile")}{" "}
          <LinkButton href="/admin/doctors" variant="link" size="sm">
            {t("manageOnDoctors")}
          </LinkButton>
        </p>
      )}
    </div>
  );
}

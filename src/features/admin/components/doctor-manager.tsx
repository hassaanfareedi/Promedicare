"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus, BriefcaseMedical, Pencil } from "lucide-react";
import { addDoctor, createDoctorAccount, updateDoctor, setDoctorActive } from "@/features/admin/actions";
import type { AdminDoctor } from "@/features/admin/data";
import { AvailabilityEditor } from "@/features/admin/components/availability-editor";
import type { Department, Profile, Specialty } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDoctorName } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function candidateLabel(c: Profile, roleLabel: string): string {
  const name = c.full_name ?? c.email ?? c.id;
  return `${name} · ${roleLabel}`;
}

type Props = {
  doctors: AdminDoctor[];
  candidates: Profile[];
  specialties: Specialty[];
  departments: Department[];
};

export function DoctorManager({ doctors, candidates, specialties, departments }: Props) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const activeCount = doctors.filter((d) => d.is_active).length;
  const noScheduleCount = doctors.filter((d) => d.availability.length === 0).length;

  const missingLabel = t("doctorNameMissing");
  const filtered = doctors
    .filter((d) => {
      if (statusFilter === "active" && !d.is_active) return false;
      if (statusFilter === "inactive" && d.is_active) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const name = (d.profile?.full_name ?? "").toLowerCase();
      const email = (d.profile?.email ?? "").toLowerCase();
      const specialty = (d.specialty?.name ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || specialty.includes(q);
    })
    .sort((a, b) =>
      doctorDisplayName(a, missingLabel).localeCompare(doctorDisplayName(b, missingLabel), undefined, {
        sensitivity: "base",
      }),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("doctorsSummary", {
            total: doctors.length,
            active: activeCount,
            noSchedule: noScheduleCount,
          })}
        </p>
        <AddDoctorDialog candidates={candidates} specialties={specialties} departments={departments} />
      </div>

      {doctors.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            <Label htmlFor="doctor-search">{tc("search")}</Label>
            <Input
              id="doctor-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, or specialty"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("status")}</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter((v as typeof statusFilter) ?? "all")}
              items={[
                { value: "all", label: t("all") },
                { value: "active", label: t("active") },
                { value: "inactive", label: t("inactive") },
              ]}
            >
              <SelectTrigger className="w-36" aria-label={t("statusFilter")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="inactive">{t("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {doctors.length === 0 ? (
        <EmptyState
          icon={BriefcaseMedical}
          title={t("noDoctorsYet")}
          description={t("noDoctorsYetDesc")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BriefcaseMedical}
          title={t("noMatches")}
          description={t("noMatchesStatusDesc")}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              specialties={specialties}
              departments={departments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClinicalFields({
  specialtyId,
  setSpecialtyId,
  departmentId,
  setDepartmentId,
  license,
  setLicense,
  years,
  setYears,
  fee,
  setFee,
  specialties,
  departments,
  idPrefix,
}: {
  specialtyId: string;
  setSpecialtyId: (v: string) => void;
  departmentId: string;
  setDepartmentId: (v: string) => void;
  license: string;
  setLicense: (v: string) => void;
  years: string;
  setYears: (v: string) => void;
  fee: string;
  setFee: (v: string) => void;
  specialties: Specialty[];
  departments: Department[];
  idPrefix: string;
}) {
  const t = useTranslations("admin");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("specialty")}</Label>
          <Select
            value={specialtyId || null}
            onValueChange={(v) => setSpecialtyId(v ?? "")}
            items={[
              { value: null, label: t("none") },
              ...specialties.map((s) => ({ value: s.id, label: s.name })),
            ]}
          >
            <SelectTrigger aria-label={t("specialty")}>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>{t("none")}</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("department")}</Label>
          <Select
            value={departmentId || null}
            onValueChange={(v) => setDepartmentId(v ?? "")}
            items={[
              { value: null, label: t("none") },
              ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
            ]}
          >
            <SelectTrigger aria-label={t("department")}>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>{t("none")}</SelectItem>
              {departments.map((dep) => (
                <SelectItem key={dep.id} value={dep.id}>
                  {dep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-license`}>{t("license")}</Label>
          <Input
            id={`${idPrefix}-license`}
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-years`}>{t("yearsExp")}</Label>
          <Input
            id={`${idPrefix}-years`}
            type="number"
            min={0}
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-fee`}>{t("fee")}</Label>
          <Input
            id={`${idPrefix}-fee`}
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

function AddDoctorDialog({
  candidates,
  specialties,
  departments,
}: {
  candidates: Profile[];
  specialties: Specialty[];
  departments: Department[];
}) {
  const t = useTranslations("admin");
  const tRoles = useTranslations("roles");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"new" | "existing">("new");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileId, setProfileId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [license, setLicense] = useState("");
  const [years, setYears] = useState("");
  const [fee, setFee] = useState("");

  function resetForm() {
    setMode("new");
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setProfileId("");
    setSpecialtyId("");
    setDepartmentId("");
    setLicense("");
    setYears("");
    setFee("");
  }

  const clinical = {
    specialtyId,
    setSpecialtyId,
    departmentId,
    setDepartmentId,
    license,
    setLicense,
    years,
    setYears,
    fee,
    setFee,
    specialties,
    departments,
  };

  function submitNew() {
    startTransition(async () => {
      const res = await createDoctorAccount({
        fullName,
        email,
        password,
        confirmPassword,
        specialtyId: specialtyId || undefined,
        departmentId: departmentId || undefined,
        licenseNumber: license || undefined,
        yearsExperience: years ? Number(years) : undefined,
        consultationFee: fee ? Number(fee) : undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("doctorAccountCreated"));
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function submitExisting() {
    startTransition(async () => {
      const res = await addDoctor({
        profileId,
        specialtyId: specialtyId || undefined,
        departmentId: departmentId || undefined,
        licenseNumber: license || undefined,
        yearsExperience: years ? Number(years) : undefined,
        consultationFee: fee ? Number(fee) : undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("doctorAdded"));
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" /> {t("addDoctor")}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addDoctor")}</DialogTitle>
          <DialogDescription>{t("addDoctorDesc")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "new" | "existing")}
          className="gap-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="new">{t("newDoctor")}</TabsTrigger>
            <TabsTrigger value="existing">{t("linkExisting")}</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-doc-name">{t("fullName")}</Label>
              <Input
                id="new-doc-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Sara Ahmed"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-doc-email">{t("email")}</Label>
              <Input
                id="new-doc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-doc-password">{t("temporaryPassword")}</Label>
                <Input
                  id="new-doc-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-doc-confirm">{t("confirmPassword")}</Label>
                <Input
                  id="new-doc-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("doctorPasswordHint")}</p>
            <ClinicalFields {...clinical} idPrefix="new" />
            <Button
              onClick={submitNew}
              disabled={pending || fullName.trim().length < 2 || !email.trim() || !password}
              className="justify-self-end"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              {t("createDoctor")}
            </Button>
          </TabsContent>

          <TabsContent value="existing" className="grid gap-4">
            {candidates.length === 0 ? (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">{t("noUsersToLink")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setMode("new")}>
                    {t("createNewDoctor")}
                  </Button>
                  <LinkButton
                    href="/admin/staff"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    {t("openStaff")}
                  </LinkButton>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t("user")}</Label>
                  <Select
                    value={profileId || null}
                    onValueChange={(v) => setProfileId(v ?? "")}
                    items={[
                      { value: null, label: t("selectUser") },
                      ...candidates.map((c) => ({
                        value: c.id,
                        label: candidateLabel(c, tRoles(c.role)),
                      })),
                    ]}
                  >
                    <SelectTrigger aria-label={t("user")}>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {candidateLabel(c, tRoles(c.role))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ClinicalFields {...clinical} idPrefix="link" />
                <Button
                  onClick={submitExisting}
                  disabled={pending || !profileId}
                  className="justify-self-end"
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Plus className="size-4" aria-hidden />
                  )}
                  {t("linkAsDoctor")}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function doctorSubtitle(doctor: AdminDoctor, generalLabel: string): string {
  const specialty = doctor.specialty?.name ?? null;
  const department = doctor.department?.name ?? null;
  if (specialty && department) {
    return specialty === department ? specialty : `${specialty} · ${department}`;
  }
  return specialty ?? department ?? generalLabel;
}

function doctorDisplayName(doctor: AdminDoctor, missingLabel: string): string {
  const name = doctor.profile?.full_name?.trim();
  if (name) return formatDoctorName(name);
  const email = doctor.profile?.email?.trim();
  if (email) return email;
  return missingLabel;
}

function formatFee(fee: number | null): string | null {
  if (fee == null) return null;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(fee);
}

function DoctorCard({
  doctor,
  specialties,
  departments,
}: {
  doctor: AdminDoctor;
  specialties: Specialty[];
  departments: Department[];
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const nameMissing = !doctor.profile?.full_name?.trim();
  const email = doctor.profile?.email?.trim() || null;
  const feeLabel = formatFee(doctor.consultation_fee);
  const dayCount = new Set(doctor.availability.map((a) => a.weekday)).size;
  const displayName = doctorDisplayName(doctor, t("doctorNameMissing"));

  async function applyActive(active: boolean) {
    setToggling(true);
    const res = await setDoctorActive(doctor.id, active);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(active ? t("doctorActivated") : t("doctorDeactivated"));
      router.refresh();
    }
    setToggling(false);
    setConfirmOff(false);
  }

  function onCheckedChange(active: boolean) {
    if (!active) {
      setConfirmOff(true);
      return;
    }
    void applyActive(true);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {doctorSubtitle(doctor, t("general"))}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[email, feeLabel, t("daysScheduled", { count: dayCount })]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {nameMissing && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {email ? t("setFullNameAccount", { email }) : t("setFullName")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <EditDoctorDialog
              doctor={doctor}
              specialties={specialties}
              departments={departments}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{doctor.is_active ? t("active") : t("inactive")}</span>
              <Switch
                checked={doctor.is_active}
                onCheckedChange={onCheckedChange}
                disabled={toggling}
                aria-label={doctor.is_active ? t("deactivateDoctor") : t("activateDoctor")}
              />
            </div>
          </div>
        </div>

        <AvailabilityEditor doctor={doctor} />
      </CardContent>

      <Dialog open={confirmOff} onOpenChange={setConfirmOff}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deactivateDoctorTitle")}</DialogTitle>
            <DialogDescription>
              {t("deactivateDoctorDesc", { name: displayName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={toggling} onClick={() => setConfirmOff(false)}>
              {tc("cancel")}
            </Button>
            <Button type="button" disabled={toggling} onClick={() => void applyActive(false)}>
              {toggling && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EditDoctorDialog({
  doctor,
  specialties,
  departments,
}: {
  doctor: AdminDoctor;
  specialties: Specialty[];
  departments: Department[];
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(doctor.profile?.full_name ?? "");
  const [specialtyId, setSpecialtyId] = useState(doctor.specialty?.id ?? "");
  const [departmentId, setDepartmentId] = useState(doctor.department?.id ?? "");
  const [license, setLicense] = useState(doctor.license_number ?? "");
  const [years, setYears] = useState(
    doctor.years_experience != null ? String(doctor.years_experience) : "",
  );
  const [fee, setFee] = useState(
    doctor.consultation_fee != null ? String(doctor.consultation_fee) : "",
  );

  function syncFromDoctor() {
    setFullName(doctor.profile?.full_name ?? "");
    setSpecialtyId(doctor.specialty?.id ?? "");
    setDepartmentId(doctor.department?.id ?? "");
    setLicense(doctor.license_number ?? "");
    setYears(doctor.years_experience != null ? String(doctor.years_experience) : "");
    setFee(doctor.consultation_fee != null ? String(doctor.consultation_fee) : "");
  }

  function submit() {
    startTransition(async () => {
      const res = await updateDoctor({
        doctorId: doctor.id,
        fullName,
        specialtyId: specialtyId || undefined,
        departmentId: departmentId || undefined,
        licenseNumber: license || undefined,
        yearsExperience: years ? Number(years) : undefined,
        consultationFee: fee ? Number(fee) : undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("doctorUpdated"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          syncFromDoctor();
          setOpen(true);
        }}
      >
        <Pencil className="size-4" aria-hidden /> {tc("edit")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) syncFromDoctor();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editDoctor")}</DialogTitle>
            <DialogDescription>{t("editDoctorDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${doctor.id}`}>{t("fullName")}</Label>
              <Input
                id={`name-${doctor.id}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dua Rahman"
              />
            </div>
            {doctor.profile?.email && (
              <div className="space-y-2">
                <Label htmlFor={`email-${doctor.id}`}>{t("email")}</Label>
                <Input
                  id={`email-${doctor.id}`}
                  value={doctor.profile.email}
                  readOnly
                  className="bg-muted"
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("specialty")}</Label>
                <Select
                  value={specialtyId || null}
                  onValueChange={(v) => setSpecialtyId(v ?? "")}
                  items={[
                    { value: null, label: t("none") },
                    ...specialties.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                >
                  <SelectTrigger aria-label={t("specialty")}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>{t("none")}</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("department")}</Label>
                <Select
                  value={departmentId || null}
                  onValueChange={(v) => setDepartmentId(v ?? "")}
                  items={[
                    { value: null, label: t("none") },
                    ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
                  ]}
                >
                  <SelectTrigger aria-label={t("department")}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>{t("none")}</SelectItem>
                    {departments.map((dep) => (
                      <SelectItem key={dep.id} value={dep.id}>
                        {dep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`license-${doctor.id}`}>{t("license")}</Label>
                <Input
                  id={`license-${doctor.id}`}
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`years-${doctor.id}`}>{t("yearsExp")}</Label>
                <Input
                  id={`years-${doctor.id}`}
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`fee-${doctor.id}`}>{t("fee")}</Label>
                <Input
                  id={`fee-${doctor.id}`}
                  type="number"
                  min={0}
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="button" disabled={pending || fullName.trim().length < 2} onClick={submit}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


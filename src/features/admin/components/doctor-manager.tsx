"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, BriefcaseMedical, Pencil } from "lucide-react";
import { addDoctor, createDoctorAccount, updateDoctor, setDoctorActive } from "@/features/admin/actions";
import type { AdminDoctor } from "@/features/admin/data";
import { AvailabilityEditor } from "@/features/admin/components/availability-editor";
import type { Department, Profile, Specialty } from "@/types";
import { ROLE_LABEL } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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

function candidateLabel(c: Profile): string {
  const name = c.full_name ?? c.email ?? c.id;
  return `${name} · ${ROLE_LABEL[c.role]}`;
}

type Props = {
  doctors: AdminDoctor[];
  candidates: Profile[];
  specialties: Specialty[];
  departments: Department[];
};

export function DoctorManager({ doctors, candidates, specialties, departments }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddDoctorDialog candidates={candidates} specialties={specialties} departments={departments} />
      </div>

      {doctors.length === 0 ? (
        <EmptyState
          icon={BriefcaseMedical}
          title="No doctors yet"
          description="Create a new doctor account or link an existing hospital user."
        />
      ) : (
        <div className="space-y-4">
          {doctors.map((d) => (
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
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Specialty</Label>
          <Select
            value={specialtyId || null}
            onValueChange={(v) => setSpecialtyId(v ?? "")}
            items={[
              { value: null, label: "None" },
              ...specialties.map((s) => ({ value: s.id, label: s.name })),
            ]}
          >
            <SelectTrigger aria-label="Specialty">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={departmentId || null}
            onValueChange={(v) => setDepartmentId(v ?? "")}
            items={[
              { value: null, label: "None" },
              ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
            ]}
          >
            <SelectTrigger aria-label="Department">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
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
          <Label htmlFor={`${idPrefix}-license`}>License</Label>
          <Input
            id={`${idPrefix}-license`}
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-years`}>Years exp.</Label>
          <Input
            id={`${idPrefix}-years`}
            type="number"
            min={0}
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-fee`}>Fee</Label>
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
      toast.success("Doctor account created");
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
      toast.success("Doctor added");
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
            <Plus className="size-4" /> Add doctor
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add doctor</DialogTitle>
          <DialogDescription>
            Create a new login for this hospital, or link someone who already has an account.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "new" | "existing")}
          className="gap-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="new">New doctor</TabsTrigger>
            <TabsTrigger value="existing">Link existing</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-doc-name">Full name</Label>
              <Input
                id="new-doc-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Sara Ahmed"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-doc-email">Email</Label>
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
                <Label htmlFor="new-doc-password">Temporary password</Label>
                <Input
                  id="new-doc-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-doc-confirm">Confirm password</Label>
                <Input
                  id="new-doc-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              At least 8 characters, with uppercase, lowercase, and a number. Share the email and
              temporary password with the doctor — they can change it via Forgot password.
            </p>
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
              Create doctor
            </Button>
          </TabsContent>

          <TabsContent value="existing" className="grid gap-4">
            {candidates.length === 0 ? (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  No users left to link. Create a new doctor account instead, or register a patient
                  first.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setMode("new")}>
                    Create new doctor
                  </Button>
                  <Link
                    href="/admin/staff"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    onClick={() => setOpen(false)}
                  >
                    Open Staff
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select
                    value={profileId || null}
                    onValueChange={(v) => setProfileId(v ?? "")}
                    items={[
                      { value: null, label: "Select a user" },
                      ...candidates.map((c) => ({
                        value: c.id,
                        label: candidateLabel(c),
                      })),
                    ]}
                  >
                    <SelectTrigger aria-label="User">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {candidateLabel(c)}
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
                  Link as doctor
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function doctorSubtitle(doctor: AdminDoctor): string {
  const specialty = doctor.specialty?.name ?? null;
  const department = doctor.department?.name ?? null;
  if (specialty && department) {
    return specialty === department ? specialty : `${specialty} · ${department}`;
  }
  return specialty ?? department ?? "General";
}

function doctorDisplayName(doctor: AdminDoctor): string {
  const name = doctor.profile?.full_name?.trim();
  if (name) return formatDoctorName(name);
  const email = doctor.profile?.email?.trim();
  if (email) return email;
  return "Doctor (name missing)";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nameMissing = !doctor.profile?.full_name?.trim();

  function toggle(active: boolean) {
    startTransition(async () => {
      const res = await setDoctorActive(doctor.id, active);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{doctorDisplayName(doctor)}</p>
            <p className="truncate text-sm text-muted-foreground">{doctorSubtitle(doctor)}</p>
            {nameMissing && doctor.profile?.email && (
              <p className="mt-0.5 truncate text-xs text-amber-700 dark:text-amber-300">
                Set a full name via Edit — account: {doctor.profile.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <EditDoctorDialog
              doctor={doctor}
              specialties={specialties}
              departments={departments}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {doctor.is_active ? "Active" : "Inactive"}
              <Switch checked={doctor.is_active} onCheckedChange={toggle} disabled={pending} />
            </label>
          </div>
        </div>

        <AvailabilityEditor doctor={doctor} />
      </CardContent>
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
      toast.success("Doctor updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) syncFromDoctor();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Pencil className="size-4" /> Edit
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit doctor</DialogTitle>
          <DialogDescription>
            Update this doctor&apos;s profile, specialty, department, and consultation fee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${doctor.id}`}>Full name</Label>
            <Input
              id={`name-${doctor.id}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dua Rahman"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Select
                value={specialtyId || null}
                onValueChange={(v) => setSpecialtyId(v ?? "")}
                items={[
                  { value: null, label: "None" },
                  ...specialties.map((s) => ({ value: s.id, label: s.name })),
                ]}
              >
                <SelectTrigger aria-label="Specialty">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={departmentId || null}
                onValueChange={(v) => setDepartmentId(v ?? "")}
                items={[
                  { value: null, label: "None" },
                  ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
                ]}
              >
                <SelectTrigger aria-label="Department">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
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
              <Label htmlFor={`license-${doctor.id}`}>License</Label>
              <Input
                id={`license-${doctor.id}`}
                value={license}
                onChange={(e) => setLicense(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`years-${doctor.id}`}>Years exp.</Label>
              <Input
                id={`years-${doctor.id}`}
                type="number"
                min={0}
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fee-${doctor.id}`}>Fee</Label>
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
            Cancel
          </Button>
          <Button type="button" disabled={pending || fullName.trim().length < 2} onClick={submit}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


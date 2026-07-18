"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, BriefcaseMedical, Clock, Trash2 } from "lucide-react";
import {
  addDoctor,
  setDoctorActive,
  addAvailability,
  removeAvailability,
} from "@/features/admin/actions";
import type { AdminDoctor } from "@/features/admin/data";
import type { Department, Profile, Specialty } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
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

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
        <EmptyState icon={BriefcaseMedical} title="No doctors yet" description="Add a doctor from your hospital staff." />
      ) : (
        <div className="space-y-4">
          {doctors.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      )}
    </div>
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
  const [profileId, setProfileId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [license, setLicense] = useState("");
  const [years, setYears] = useState("");
  const [fee, setFee] = useState("");

  function submit() {
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
      setProfileId("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" disabled={candidates.length === 0}>
            <Plus className="size-4" /> Add doctor
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add doctor</DialogTitle>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No eligible staff. Team members must sign up and belong to your hospital first.
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Staff member</Label>
              <Select value={profileId} onValueChange={(v) => setProfileId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name ?? c.email ?? c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select value={specialtyId} onValueChange={(v) => setSpecialtyId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="license">License</Label>
                <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Years exp.</Label>
                <Input id="years" type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Fee</Label>
                <Input id="fee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
              </div>
            </div>
            <Button onClick={submit} disabled={pending || !profileId} className="justify-self-end">
              {pending ? <Loader2 className="animate-spin" /> : null}
              Add doctor
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DoctorCard({ doctor }: { doctor: AdminDoctor }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Dr. {doctor.profile?.full_name ?? "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">
              {doctor.specialty?.name ?? "General"}
              {doctor.department?.name ? ` · ${doctor.department.name}` : ""}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {doctor.is_active ? "Active" : "Inactive"}
            <Switch checked={doctor.is_active} onCheckedChange={toggle} disabled={pending} />
          </label>
        </div>

        <AvailabilityEditor doctor={doctor} />
      </CardContent>
    </Card>
  );
}

function AvailabilityEditor({ doctor }: { doctor: AdminDoctor }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [slot, setSlot] = useState("30");

  function add() {
    startTransition(async () => {
      const res = await addAvailability({
        doctorId: doctor.id,
        weekday: Number(weekday),
        startTime: start,
        endTime: end,
        slotMinutes: Number(slot),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Availability added");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeAvailability(id);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-teal-600" aria-hidden /> Weekly availability
      </p>

      {doctor.availability.length > 0 ? (
        <ul className="mb-3 space-y-1.5">
          {[...doctor.availability]
            .sort((a, b) => a.weekday - b.weekday)
            .map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {WEEKDAYS[a.weekday]} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)} ({a.slot_minutes}m)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  aria-label={`Remove ${WEEKDAYS[a.weekday]} availability`}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </li>
            ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">No availability set.</p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Day</Label>
          <Select value={weekday} onValueChange={(v) => setWeekday(v ?? "")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((w, i) => (
                <SelectItem key={i} value={String(i)}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Start</Label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-28" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End</Label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-28" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slot (min)</Label>
          <Input type="number" min={5} value={slot} onChange={(e) => setSlot(e.target.value)} className="w-20" />
        </div>
        <Button size="sm" onClick={add} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </Button>
      </div>
    </div>
  );
}

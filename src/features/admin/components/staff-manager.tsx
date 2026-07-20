"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCog, UserMinus, Stethoscope, AlertCircle } from "lucide-react";
import { assignRole, demoteToPatient } from "@/features/admin/actions";
import type { AdminStaffMember } from "@/features/admin/data";
import type { UserRole } from "@/types";
import { ROLE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
      {ROLE_LABEL[role]}
    </span>
  );
}

function StaffCard({ member }: { member: AdminStaffMember }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<string>(member.role);
  const [demoteOpen, setDemoteOpen] = useState(false);
  const [demoting, setDemoting] = useState(false);
  const locked = member.role === "hospital_admin" || member.role === "super_admin";
  const name = member.full_name?.trim() || "Unnamed";
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
      toast.success("Role updated");
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
    toast.success("Demoted to patient");
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
                    Clinical profile linked
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3.5 text-amber-600" aria-hidden />
                    Needs Doctors setup —{" "}
                    <Link
                      href="/admin/doctors"
                      className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
                    >
                      Open Doctors
                    </Link>
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
                items={ASSIGNABLE.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
              >
                <SelectTrigger className="w-36" aria-label={`Role for ${name}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
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
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDemoteOpen(true)}
                aria-label={`Demote ${name}`}
              >
                <UserMinus className="size-4" aria-hidden />
                Demote
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={demoteOpen} onOpenChange={setDemoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Demote to patient?</DialogTitle>
            <DialogDescription>
              {name} will become a patient again and can be re-promoted later. If they have a
              clinical doctor profile, it will be removed (open appointments must be cleared first).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={demoting}
              onClick={() => setDemoteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={demoting} onClick={() => void confirmDemote()}>
              {demoting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Demote to patient
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
          {staff.length} total · {doctors} doctors · {receptionists} receptionists · {admins}{" "}
          admins
        </p>
        {promoteAction}
      </div>

      {staff.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            <Label htmlFor="staff-search">Search</Label>
            <Input
              id="staff-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or email"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter((v as RoleFilter) ?? "all")}
              items={[
                { value: "all", label: "All roles" },
                { value: "doctor", label: "Doctor" },
                { value: "receptionist", label: "Receptionist" },
                { value: "hospital_admin", label: "Admin" },
              ]}
            >
              <SelectTrigger className="w-40" aria-label="Role filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="hospital_admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {staff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff yet"
          description="Promote a patient or create a receptionist account to get started."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No matches"
          description="Try a different search or role filter."
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
          Some doctors still need a clinical profile.{" "}
          <Link href="/admin/doctors" className={buttonVariants({ variant: "link", size: "sm" })}>
            Manage on Doctors
          </Link>
        </p>
      )}
    </div>
  );
}

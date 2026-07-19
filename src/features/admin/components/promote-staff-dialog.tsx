"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { promoteToStaff } from "@/features/admin/actions";
import type { Profile, UserRole } from "@/types";
import { ROLE_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const ROLES: UserRole[] = ["doctor", "receptionist"];

export function PromoteStaffDialog({ candidates }: { candidates: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [profileId, setProfileId] = useState("");
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor");

  const items = useMemo(
    () =>
      candidates.map((p) => ({
        value: p.id,
        label: `${p.full_name ?? "Unnamed"} · ${p.email ?? p.id}`,
      })),
    [candidates],
  );

  function submit() {
    startTransition(async () => {
      const res = await promoteToStaff({ profileId, role });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Promoted to ${ROLE_LABEL[role]}`);
      setOpen(false);
      setProfileId("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            disabled={candidates.length === 0}
            title={
              candidates.length === 0
                ? "No patient accounts available to promote"
                : "Promote a patient account to Doctor or Receptionist"
            }
          >
            <UserPlus className="size-4" aria-hidden /> Promote to staff
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote to staff</DialogTitle>
          <DialogDescription>
            Choose a patient account at your hospital and assign Doctor or Receptionist. Then add them
            under Doctors if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promote-user">User</Label>
            <Select
              value={profileId || null}
              onValueChange={(v) => setProfileId(v ?? "")}
              items={[{ value: null, label: "Select a user…" }, ...items]}
            >
              <SelectTrigger id="promote-user" aria-label="User">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ?? "Unnamed"} · {p.email ?? p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="promote-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (v === "doctor" || v === "receptionist") setRole(v);
              }}
              items={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            >
              <SelectTrigger id="promote-role" aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={pending || !profileId} onClick={submit}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Confirm promotion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { assignRole } from "@/features/admin/actions";
import type { Profile, UserRole } from "@/types";
import { ROLE_LABEL } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSIGNABLE: UserRole[] = ["patient", "doctor", "receptionist"];

function StaffRow({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<string>(profile.role);
  const locked = profile.role === "hospital_admin" || profile.role === "super_admin";

  function save() {
    startTransition(async () => {
      const res = await assignRole({ profileId: profile.id, role: role as "patient" | "doctor" | "receptionist" });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Role updated");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{profile.full_name ?? "—"}</TableCell>
      <TableCell className="hidden text-muted-foreground sm:table-cell">{profile.email ?? "—"}</TableCell>
      <TableCell>
        {locked ? (
          <span className="text-sm text-muted-foreground">{ROLE_LABEL[profile.role]}</span>
        ) : (
          <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
            <SelectTrigger className="w-36">
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
        )}
      </TableCell>
      <TableCell className="text-right">
        {!locked && (
          <Button size="sm" variant="outline" onClick={save} disabled={pending || role === profile.role}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function StaffTable({ staff }: { staff: Profile[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((p) => (
              <StaffRow key={p.id} profile={p} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

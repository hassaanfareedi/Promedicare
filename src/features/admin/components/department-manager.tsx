"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Building2 } from "lucide-react";
import { createDepartment, setDepartmentActive } from "@/features/admin/actions";
import type { Department } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";

export function DepartmentManager({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function add() {
    startTransition(async () => {
      const res = await createDepartment({ name, description: description || undefined });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Department created");
      setName("");
      setDescription("");
      router.refresh();
    });
  }

  async function toggle(id: string, active: boolean) {
    // Per-row pending so toggling one department doesn't disable the whole panel.
    setTogglingId(id);
    const res = await setDepartmentActive(id, active);
    if (!res.ok) toast.error(res.error);
    else router.refresh();
    setTogglingId(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-medium">Add department</h2>
          <div className="space-y-2">
            <Label htmlFor="dept-name">Name</Label>
            <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cardiology" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description (optional)</Label>
            <Textarea id="dept-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={add} disabled={pending || name.trim().length < 2}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
            Add department
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {departments.length === 0 ? (
          <EmptyState icon={Building2} title="No departments" description="Add your first department." />
        ) : (
          departments.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{d.name}</p>
                  {d.description && <p className="truncate text-sm text-muted-foreground">{d.description}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  {d.is_active ? "Active" : "Inactive"}
                  <Switch
                    checked={d.is_active}
                    onCheckedChange={(c) => toggle(d.id, c)}
                    disabled={togglingId === d.id}
                  />
                </label>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

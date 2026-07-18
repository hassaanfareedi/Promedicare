"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Stethoscope } from "lucide-react";
import { createSpecialty } from "@/features/platform/actions";
import type { Specialty } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function SpecialtyManager({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  function add() {
    startTransition(async () => {
      const res = await createSpecialty({ name, slug: slug || slugify(name), description: description || undefined });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Specialty created");
      setName("");
      setSlug("");
      setDescription("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-medium">Add specialty</h2>
          <div className="space-y-2">
            <Label htmlFor="s-name">Name</Label>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              placeholder="Cardiology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-slug">Slug</Label>
            <Input id="s-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cardiology" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-desc">Description (optional)</Label>
            <Textarea id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={add} disabled={pending || name.trim().length < 2}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
            Add specialty
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {specialties.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No specialties" description="Add your first specialty." />
        ) : (
          specialties.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <p className="font-medium">{s.name}</p>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Stethoscope, Pencil, Trash2, Search } from "lucide-react";
import {
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from "@/features/platform/actions";
import type { Specialty } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SpecialtyManager({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSlugDirty, setEditSlugDirty] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editPending, startEditTransition] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return specialties;
    return specialties.filter((s) => {
      const hay = `${s.name} ${s.slug} ${s.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [specialties, query]);

  function add() {
    startTransition(async () => {
      const res = await createSpecialty({
        name,
        slug: slug || slugify(name),
        description: description || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Specialty created");
      setName("");
      setSlug("");
      setSlugDirty(false);
      setDescription("");
      router.refresh();
    });
  }

  function openEdit(s: Specialty) {
    setEditing(s);
    setEditName(s.name);
    setEditSlug(s.slug);
    setEditSlugDirty(true);
    setEditDescription(s.description ?? "");
    setEditOpen(true);
  }

  function saveEdit() {
    if (!editing) return;
    startEditTransition(async () => {
      const res = await updateSpecialty({
        id: editing.id,
        name: editName,
        slug: editSlug || slugify(editName),
        description: editDescription || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Specialty updated");
      setEditOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const res = await deleteSpecialty(deleteTarget.id);
    setDeletingId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Specialty deleted");
    setDeleteTarget(null);
    router.refresh();
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
                if (!slugDirty) setSlug(slugify(e.target.value));
              }}
              placeholder="Cardiology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-slug">Slug</Label>
            <Input
              id="s-slug"
              value={slug}
              onChange={(e) => {
                setSlugDirty(true);
                setSlug(e.target.value);
              }}
              placeholder="cardiology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-desc">Description (optional)</Label>
            <Textarea
              id="s-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={add} disabled={pending || name.trim().length < 2}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            Add specialty
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search specialties…"
            className="pl-9"
            aria-label="Search specialties"
          />
        </div>

        {specialties.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No specialties"
            description="Add your first specialty."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try a different search term."
          />
        ) : (
          filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.slug}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(s)}
                    aria-label={`Edit ${s.name}`}
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTarget(s)}
                    disabled={deletingId === s.id}
                    aria-label={`Delete ${s.name}`}
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit specialty</DialogTitle>
            <DialogDescription>Update the name, slug, or description.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-s-name">Name</Label>
              <Input
                id="edit-s-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (!editSlugDirty) setEditSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-s-slug">Slug</Label>
              <Input
                id="edit-s-slug"
                value={editSlug}
                onChange={(e) => {
                  setEditSlugDirty(true);
                  setEditSlug(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-s-desc">Description (optional)</Label>
              <Textarea
                id="edit-s-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveEdit}
              disabled={editPending || editName.trim().length < 2}
            >
              {editPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete specialty?</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{deleteTarget?.name}</span> from
              the global catalog. Doctors linked to it keep their profiles; the specialty link will
              be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus, Building2, UserCog } from "lucide-react";
import { createHospital, setHospitalActive, assignHospitalAdmin } from "@/features/platform/actions";
import type { Hospital, Profile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function HospitalManager({
  hospitals,
  profiles,
}: {
  hospitals: Hospital[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const t = useTranslations("platform");
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [city, setCity] = useState("");

  function add() {
    startTransition(async () => {
      const res = await createHospital({ name, slug: slug || slugify(name), city: city || undefined });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("hospitalCreated"));
      setName("");
      setSlug("");
      setSlugDirty(false);
      setCity("");
      router.refresh();
    });
  }

  async function toggle(id: string, active: boolean) {
    // Per-row pending so toggling one hospital doesn't disable the whole panel.
    setTogglingId(id);
    const res = await setHospitalActive(id, active);
    if (!res.ok) toast.error(res.error);
    else router.refresh();
    setTogglingId(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-medium">{t("addHospital")}</h2>
          <div className="space-y-2">
            <Label htmlFor="h-name">{t("name")}</Label>
            <Input
              id="h-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugDirty) setSlug(slugify(e.target.value));
              }}
              placeholder="City General Hospital"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="h-slug">{t("slug")}</Label>
            <Input
              id="h-slug"
              value={slug}
              onChange={(e) => {
                setSlugDirty(true);
                setSlug(e.target.value);
              }}
              placeholder="city-general"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="h-city">{t("cityOptional")}</Label>
            <Input id="h-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <Button onClick={add} disabled={pending || name.trim().length < 2}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
            {t("addHospital")}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {hospitals.length === 0 ? (
          <EmptyState icon={Building2} title={t("noHospitals")} description={t("noHospitalsDesc")} />
        ) : (
          hospitals.map((h) => (
            <Card key={h.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{h.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {h.city ? `${h.city} · ` : ""}
                    <span className="font-mono">{h.slug}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AssignAdminDialog hospital={h} profiles={profiles} />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    {h.is_active ? t("active") : t("inactive")}
                    <Switch
                      checked={h.is_active}
                      onCheckedChange={(c) => toggle(h.id, c)}
                      disabled={togglingId === h.id}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AssignAdminDialog({ hospital, profiles }: { hospital: Hospital; profiles: Profile[] }) {
  const router = useRouter();
  const t = useTranslations("platform");
  const tRoles = useTranslations("roles");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [profileId, setProfileId] = useState("");
  const [confirming, setConfirming] = useState(false);

  const eligible = profiles.filter(
    (p) => p.role !== "super_admin" && p.role !== "patient",
  );
  const selected = eligible.find((p) => p.id === profileId);

  function submit() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const res = await assignHospitalAdmin({ profileId, hospitalId: hospital.id });
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success(t("adminAssigned"));
      setOpen(false);
      setConfirming(false);
      setProfileId("");
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirming(false);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserCog className="size-4" aria-hidden /> {t("assignAdmin")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignAdminTitle", { name: hospital.name })}</DialogTitle>
          <DialogDescription>
            {t("assignAdminDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`assign-admin-${hospital.id}`}>{t("user")}</Label>
            <Select
              value={profileId || null}
              onValueChange={(v) => {
                setProfileId(v ?? "");
                setConfirming(false);
              }}
              items={[
                { value: null, label: "Select a user…" },
                ...eligible.map((p) => ({
                  value: p.id,
                  label: `${p.full_name ?? p.email ?? p.id} (${p.role})`,
                })),
              ]}
            >
              <SelectTrigger id={`assign-admin-${hospital.id}`} aria-label={t("user")}>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {eligible.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ?? p.email ?? p.id} ({p.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {confirming && selected && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {t("assignAdminConfirm", {
                name: selected.full_name ?? selected.email ?? "",
                role: tRoles(selected.role),
              })}
            </p>
          )}
          <Button onClick={submit} disabled={pending || !profileId} className="w-full">
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {confirming ? t("confirmAssignAdmin") : t("makeHospitalAdmin")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

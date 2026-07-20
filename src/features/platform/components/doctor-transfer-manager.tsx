"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft, BriefcaseMedical, Loader2 } from "lucide-react";
import { transferDoctor } from "@/features/platform/actions";
import type { PlatformDoctor } from "@/features/platform/data";
import type { Hospital } from "@/types";
import { formatDoctorName } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function displayName(d: PlatformDoctor): string {
  const name = d.profile?.full_name?.trim();
  if (name) return formatDoctorName(name);
  return d.profile?.email?.trim() || "Doctor (name missing)";
}

export function DoctorTransferManager({
  doctors,
  hospitals,
}: {
  doctors: PlatformDoctor[];
  hospitals: Hospital[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");
  const [transferring, setTransferring] = useState<PlatformDoctor | null>(null);
  const [toHospitalId, setToHospitalId] = useState("");
  const [pending, startTransition] = useTransition();

  const activeHospitals = useMemo(
    () => hospitals.filter((h) => h.is_active && !h.deleted_at),
    [hospitals],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors
      .filter((d) => {
        if (hospitalFilter !== "all" && d.hospital_id !== hospitalFilter) return false;
        if (!q) return true;
        const hay = `${d.profile?.full_name ?? ""} ${d.profile?.email ?? ""} ${d.specialty_name ?? ""} ${d.hospital_name ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => displayName(a).localeCompare(displayName(b), undefined, { sensitivity: "base" }));
  }, [doctors, query, hospitalFilter]);

  const destinationOptions = useMemo(() => {
    if (!transferring) return activeHospitals;
    return activeHospitals.filter((h) => h.id !== transferring.hospital_id);
  }, [activeHospitals, transferring]);

  function openTransfer(d: PlatformDoctor) {
    setTransferring(d);
    setToHospitalId("");
  }

  function submitTransfer() {
    if (!transferring || !toHospitalId) return;
    startTransition(async () => {
      const res = await transferDoctor({
        doctorId: transferring.id,
        toHospitalId,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Doctor transferred");
      setTransferring(null);
      setToHospitalId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Label htmlFor="platform-doctor-search">Search</Label>
          <Input
            id="platform-doctor-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, specialty, or hospital"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Hospital</Label>
          <Select
            value={hospitalFilter}
            onValueChange={(v) => setHospitalFilter(v ?? "all")}
            items={[
              { value: "all", label: "All hospitals" },
              ...hospitals.map((h) => ({ value: h.id, label: h.name })),
            ]}
          >
            <SelectTrigger className="w-48" aria-label="Hospital filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hospitals</SelectItem>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {doctors.length === 0 ? (
        <EmptyState
          icon={BriefcaseMedical}
          title="No doctors yet"
          description="Doctors appear here after a hospital admin creates or links them."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BriefcaseMedical}
          title="No matches"
          description="Try a different search or hospital filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-medium">{displayName(d)}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[d.specialty_name ?? "General", d.hospital_name ?? "Unknown hospital"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[d.profile?.email, d.is_active ? "Active" : "Inactive"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openTransfer(d)}
                  disabled={
                    activeHospitals.filter((h) => h.id !== d.hospital_id).length === 0
                  }
                >
                  <ArrowRightLeft className="size-4" aria-hidden />
                  Transfer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(transferring)}
        onOpenChange={(open) => {
          if (!open) {
            setTransferring(null);
            setToHospitalId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer doctor</DialogTitle>
            <DialogDescription>
              Move {transferring ? displayName(transferring) : "this doctor"} from{" "}
              {transferring?.hospital_name ?? "their current hospital"} to another hospital. Open
              upcoming appointments must be resolved first. Department assignment is cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Destination hospital</Label>
            {destinationOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other active hospitals available.</p>
            ) : (
              <Select
                value={toHospitalId || null}
                onValueChange={(v) => setToHospitalId(v ?? "")}
                items={destinationOptions.map((h) => ({ value: h.id, label: h.name }))}
              >
                <SelectTrigger aria-label="Destination hospital">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setTransferring(null);
                setToHospitalId("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !toHospitalId}
              onClick={submitTransfer}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Confirm transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

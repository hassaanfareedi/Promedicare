"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { createReceptionistAccount, promoteToStaff } from "@/features/admin/actions";
import type { Profile, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLES: UserRole[] = ["doctor", "receptionist"];

export function PromoteStaffDialog({ candidates }: { candidates: Profile[] }) {
  const t = useTranslations("admin");
  const tRoles = useTranslations("roles");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"promote" | "new">("promote");

  const [profileId, setProfileId] = useState("");
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor");
  const [candidateQuery, setCandidateQuery] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const filteredCandidates = useMemo(() => {
    const q = candidateQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((p) => {
      const hay = `${p.full_name ?? ""} ${p.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [candidates, candidateQuery]);

  const items = useMemo(
    () =>
      filteredCandidates.map((p) => ({
        value: p.id,
        label: `${p.full_name ?? t("unnamed")} · ${p.email ?? p.id}`,
      })),
    [filteredCandidates, t],
  );

  function resetForm() {
    setMode("promote");
    setProfileId("");
    setRole("doctor");
    setCandidateQuery("");
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  function submitPromote() {
    startTransition(async () => {
      const res = await promoteToStaff({ profileId, role });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("promotedTo", { role: tRoles(role) }));
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function submitNew() {
    startTransition(async () => {
      const res = await createReceptionistAccount({
        fullName,
        email,
        password,
        confirmPassword,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("receptionistAccountCreated"));
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
            <UserPlus className="size-4" aria-hidden /> {t("addStaff")}
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addStaff")}</DialogTitle>
          <DialogDescription>{t("addStaffDesc")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "promote" | "new")}
          className="gap-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="promote">{t("promoteExisting")}</TabsTrigger>
            <TabsTrigger value="new">{t("newReceptionist")}</TabsTrigger>
          </TabsList>

          <TabsContent value="promote" className="grid gap-4">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noPatientsToPromote")}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="promote-search">{t("searchPatients")}</Label>
                  <Input
                    id="promote-search"
                    value={candidateQuery}
                    onChange={(e) => setCandidateQuery(e.target.value)}
                    placeholder="Name or email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promote-user">{t("user")}</Label>
                  {filteredCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noMatchesSearch")}</p>
                  ) : (
                    <Select
                      value={profileId || null}
                      onValueChange={(v) => setProfileId(v ?? "")}
                      items={[{ value: null, label: t("selectUser") }, ...items]}
                    >
                      <SelectTrigger id="promote-user" aria-label={t("user")}>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCandidates.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name ?? t("unnamed")} · {p.email ?? p.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promote-role">{t("role")}</Label>
                  <Select
                    value={role}
                    onValueChange={(v) => {
                      if (v === "doctor" || v === "receptionist") setRole(v);
                    }}
                    items={ROLES.map((r) => ({ value: r, label: tRoles(r) }))}
                  >
                    <SelectTrigger id="promote-role" aria-label={t("role")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {tRoles(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={pending || !profileId}
                  onClick={submitPromote}
                >
                  {pending && <Loader2 className="animate-spin" aria-hidden />}
                  {t("confirmPromotion")}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-rec-name">{t("fullName")}</Label>
              <Input
                id="new-rec-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sara Reception"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-rec-email">{t("email")}</Label>
              <Input
                id="new-rec-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reception@hospital.com"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-rec-password">{t("temporaryPassword")}</Label>
                <Input
                  id="new-rec-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rec-confirm">{t("confirmPassword")}</Label>
                <Input
                  id="new-rec-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("receptionistPasswordHint")}</p>
            <Button
              className="w-full"
              disabled={
                pending || fullName.trim().length < 2 || !email.trim() || !password || !confirmPassword
              }
              onClick={submitNew}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {t("createReceptionist")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

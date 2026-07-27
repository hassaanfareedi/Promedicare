"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollableList } from "@/components/shared/scrollable-list";
import { ReliableNavLink } from "@/components/shared/reliable-nav-link";
import { ROLE_HOME } from "@/lib/constants";
import type { Notification, UserRole } from "@/types";

function notificationHref(role: UserRole, n: Notification): string {
  const data =
    n.data && typeof n.data === "object" && !Array.isArray(n.data)
      ? (n.data as Record<string, unknown>)
      : null;
  const hasAppointment = typeof data?.appointmentId === "string";
  const hasPrediction = typeof data?.predictionId === "string";

  switch (role) {
    case "doctor":
      if (
        n.type === "appointment_booked" ||
        n.type === "appointment_rescheduled" ||
        n.type === "appointment_confirmed" ||
        n.type === "appointment_cancelled" ||
        n.type === "appointment_reminder" ||
        hasAppointment
      ) {
        return "/doctor/schedule";
      }
      if (n.type === "prediction_reviewed" || hasPrediction) return "/doctor/reviews";
      return "/doctor";
    case "receptionist":
      if (hasAppointment || n.type.startsWith("appointment_")) return "/reception/appointments";
      return "/reception";
    case "hospital_admin":
      if (hasAppointment || n.type.startsWith("appointment_")) return "/admin/appointments";
      return "/admin";
    case "patient":
      if (n.type === "prediction_reviewed" || hasPrediction) return "/patient/screenings";
      if (
        n.type === "appointment_confirmed" ||
        n.type === "appointment_rescheduled" ||
        n.type === "appointment_cancelled" ||
        n.type === "appointment_reminder" ||
        n.type === "appointment_booked" ||
        hasAppointment
      ) {
        return "/patient/appointments";
      }
      return "/patient";
    default:
      return ROLE_HOME[role];
  }
}

function localizedTitle(
  t: (key: string) => string,
  n: Notification,
): string {
  switch (n.type) {
    case "appointment_booked":
      return t("appointmentRequest");
    case "appointment_confirmed":
      return t("appointmentConfirmed");
    case "appointment_cancelled":
      return t("appointmentCancelled");
    case "appointment_rescheduled":
      return t("appointmentRescheduled");
    default:
      return n.title;
  }
}

export function NotificationBell({ role }: { role: UserRole }) {
  const t = useTranslations("notifications");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) {
      setLoading(false);
      return;
    }
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
          (payload) => {
            const n = payload.new as Notification;
            setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev].slice(0, 15)));
            toast(localizedTitle(t, n), { description: n.body ?? undefined });
          },
        )
        .subscribe();
    });

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void load();
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load, t]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0 || marking) return;
    setMarking(true);
    const supabase = createClient();
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .in("id", unreadIds);
    setMarking(false);
    if (error) {
      toast.error("Could not mark notifications as read.");
      return;
    }
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: readAt })));
  }

  async function openNotification(n: Notification) {
    if (!n.read_at) {
      const supabase = createClient();
      const readAt = new Date().toISOString();
      const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", n.id);
      if (!error) {
        setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, read_at: readAt } : item)));
      }
    }
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            aria-label={t("title")}
            className="relative"
          >
            <Bell className="size-4" aria-hidden />
            {unread > 0 && (
              <span
                aria-hidden
                className="absolute -end-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-teal-600 text-[10px] font-semibold text-white"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-medium">{t("title")}</span>
          {unread > 0 && (
            <button
              type="button"
              disabled={marking}
              onClick={() => void markAllRead()}
              className="rounded-sm text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {t("markRead")}
            </button>
          )}
        </div>
        <ScrollableList
          loading={loading}
          empty={items.length === 0}
          emptyLabel={t("empty")}
        >
          {items.map((n) => {
            const title = localizedTitle(t, n);
            return (
              <ReliableNavLink
                key={n.id}
                href={notificationHref(role, n)}
                onClick={() => void openNotification(n)}
                aria-label={title}
                className={`block border-b px-4 py-3 last:border-0 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  n.read_at ? "" : "bg-teal-50/50 dark:bg-teal-950/20"
                }`}
              >
                <p className="text-sm font-medium">{title}</p>
                {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </ReliableNavLink>
            );
          })}
        </ScrollableList>
      </PopoverContent>
    </Popover>
  );
}

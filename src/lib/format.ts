import { format, formatDistanceToNow, isValid } from "date-fns";

/** Formats an ISO timestamp; returns an em dash for empty/invalid input. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "PPP p") : "—";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "PPP") : "—";
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, "p") : "—";
}

export function fromNow(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "";
}

"use client";

import { PortalError } from "@/components/shared/portal-error";

export default function ReceptionError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalError {...props} />;
}

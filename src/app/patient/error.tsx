"use client";

import { PortalError } from "@/components/shared/portal-error";

export default function PatientError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalError {...props} />;
}

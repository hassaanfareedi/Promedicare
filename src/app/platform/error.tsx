"use client";

import { PortalError } from "@/components/shared/portal-error";

export default function PlatformError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalError {...props} />;
}

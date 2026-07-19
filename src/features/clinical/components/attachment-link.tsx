"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Paperclip } from "lucide-react";
import { getAttachmentSignedUrl } from "@/features/clinical/actions";
import { Button } from "@/components/ui/button";

export function AttachmentLink({
  id,
  fileName,
}: {
  id: string;
  fileName: string;
}) {
  const [pending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      const res = await getAttachmentSignedUrl(id);
      if (!res.ok || !res.data) {
        toast.error(res.ok ? "Download unavailable" : res.error);
        return;
      }
      const url = res.data.url;
      // Opening after an await can trip popup blockers (no longer a direct
      // user gesture). Offer a tap-to-open fallback when the window is blocked.
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        toast("Your browser blocked the file from opening.", {
          description: "Tap Open to view it in a new tab.",
          action: {
            label: "Open",
            onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
          },
        });
      }
    });
  }

  return (
    <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={pending} onClick={open}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
      {fileName}
    </Button>
  );
}

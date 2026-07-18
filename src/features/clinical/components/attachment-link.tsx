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
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <Button type="button" variant="link" size="sm" className="h-auto px-0" disabled={pending} onClick={open}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
      {fileName}
    </Button>
  );
}

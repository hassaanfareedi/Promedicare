"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { checkInWithFee } from "@/features/reception/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  defaultFee?: number | null;
};

export function CheckInFeeDialog({ open, onOpenChange, appointmentId, defaultFee }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(defaultFee ?? 0));
  const [method, setMethod] = useState<"cash" | "card" | "other">("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(String(defaultFee ?? 0));
    setMethod("cash");
    setNotes("");
  }, [open, appointmentId, defaultFee]);

  function submit() {
    startTransition(async () => {
      const res = await checkInWithFee({
        appointmentId,
        amount: Number(amount),
        method,
        notes,
        currency: "PKR",
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Patient checked in — fee recorded");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check in — collect fee</DialogTitle>
          <DialogDescription>Record the consultation fee before marking the patient as checked in.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fee-amount">Amount received (PKR)</Label>
            <Input
              id="fee-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fee-method">Payment method</Label>
            <Select
              value={method}
              onValueChange={(v) => {
                if (v === "cash" || v === "card" || v === "other") setMethod(v);
              }}
              items={[
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "other", label: "Other" },
              ]}
            >
              <SelectTrigger id="fee-method" aria-label="Payment method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fee-notes">Note (optional)</Label>
            <Textarea
              id="fee-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={submit}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Check in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

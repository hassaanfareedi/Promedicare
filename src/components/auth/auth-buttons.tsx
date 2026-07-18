"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/actions";
import { toast } from "sonner";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function GoogleButton() {
  async function handle() {
    const res = await signInWithGoogle();
    if (res && "error" in res) toast.error(res.error);
  }
  return (
    <form action={handle}>
      <Button type="submit" variant="outline" className="w-full">
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12.24 10.4v3.44h5.7c-.24 1.48-1.72 4.34-5.7 4.34-3.43 0-6.23-2.84-6.23-6.34s2.8-6.34 6.23-6.34c1.95 0 3.26.83 4.01 1.55l2.73-2.63C17.2 2.3 14.97 1.3 12.24 1.3 6.98 1.3 2.7 5.58 2.7 12s4.28 10.7 9.54 10.7c5.5 0 9.14-3.87 9.14-9.32 0-.63-.07-1.1-.16-1.58z"
      />
    </svg>
  );
}

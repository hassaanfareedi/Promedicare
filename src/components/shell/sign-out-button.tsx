"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SignOutInner({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      disabled={pending}
      aria-label="Sign out"
      className={cn(
        "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-4" aria-hidden />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <SignOutInner className={className} />
    </form>
  );
}

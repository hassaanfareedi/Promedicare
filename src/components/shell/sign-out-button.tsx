"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function SignOutInner({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      disabled={pending}
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

function SignOutMenuInner() {
  const { pending } = useFormStatus();
  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={pending}
      render={<button type="submit" />}
      className="w-full"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-4" aria-hidden />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );
}

export function SignOutButton({
  className,
  asMenuItem = false,
}: {
  className?: string;
  asMenuItem?: boolean;
}) {
  return (
    <form action={logout}>
      {asMenuItem ? <SignOutMenuInner /> : <SignOutInner className={className} />}
    </form>
  );
}

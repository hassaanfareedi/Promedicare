import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <Logo className="mb-6" />
        <p className="text-sm font-medium text-teal-600 dark:text-teal-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-6" })}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

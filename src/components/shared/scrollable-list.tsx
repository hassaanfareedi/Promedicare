import { Loader2 } from "lucide-react";

export function ScrollableList({
  loading,
  empty,
  emptyLabel,
  children,
}: {
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-h-80 overflow-y-auto">
      {loading ? (
        <div
          role="status"
          aria-busy="true"
          className="flex items-center justify-center py-10 text-muted-foreground"
        >
          <Loader2 className="size-5 animate-spin" aria-hidden />
          <span className="sr-only">Loading</span>
        </div>
      ) : empty ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        children
      )}
    </div>
  );
}

import { Skeleton } from "@/components/shared/skeleton";

export function PageLoader() {
  return (
    <div className="relative min-h-96 w-full space-y-6 p-6">
      {/* Top micro progress line */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary/10">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>

      {/* Page skeleton placeholders */}
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-72 rounded" />
        <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="mt-6 h-64 rounded-xl" />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between gap-4 border-b p-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="p-3">
        <div className="space-y-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="grid gap-3">
              {Array.from({ length: rows }).map((_, r) => (
                <Skeleton key={r} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

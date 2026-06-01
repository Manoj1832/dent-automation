import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4 px-4 py-3 border-t border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={`r-${r}-c-${c}`}
              className={cn('h-4 flex-1', c === 0 && 'max-w-[180px]')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}
      className="mb-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 bg-slate-100 space-y-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <StatCardSkeleton />
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <TableSkeleton />
      </div>
    </div>
  );
}

export { Skeleton, TableSkeleton, StatCardSkeleton, PageSkeleton }

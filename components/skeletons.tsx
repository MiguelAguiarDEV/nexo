export function ShoppingListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden animate-pulse">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-2 h-8" />
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-16 sm:min-h-24 p-1 border-b border-r">
            <div className="h-5 w-5 rounded-full bg-muted mb-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-64 rounded bg-muted" />
    </div>
  );
}

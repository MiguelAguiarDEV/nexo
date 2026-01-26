export default function FinanceLoading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>

        {/* Filter skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-card rounded-lg border">
              <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>

        {/* Expense list skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-card rounded-lg border">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

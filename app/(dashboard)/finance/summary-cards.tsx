interface SummaryCardsProps {
  total: number;
  count: number;
  average: number;
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
}

export function SummaryCards({ total, count, average, byCategory }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total */}
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Total gastado</p>
        <p className="text-2xl font-bold">{total.toFixed(2)}€</p>
      </div>

      {/* Count */}
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Número de gastos</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>

      {/* Average */}
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Promedio</p>
        <p className="text-2xl font-bold">{average.toFixed(2)}€</p>
      </div>

      {/* By Category - Full Width on mobile, spans all columns */}
      {byCategory.length > 0 && (
        <div className="sm:col-span-3 p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground mb-3">Por categoría</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byCategory.map((cat) => (
              <div key={cat.category} className="flex justify-between items-center">
                <span className="text-sm font-medium">{cat.category}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold">{cat.total.toFixed(2)}€</span>
                  <span className="text-xs text-muted-foreground ml-2">({cat.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

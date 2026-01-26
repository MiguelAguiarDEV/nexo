"use client";

import type { ExpenseWithItems } from "./actions";
import { formatDistanceToNow } from "@/lib/utils/date";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { deleteExpense } from "./actions";
import { useState } from "react";

interface ExpenseListProps {
  expenses: ExpenseWithItems[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      return;
    }

    setDeletingId(id);
    const result = await deleteExpense(id);
    setDeletingId(null);

    if (!result.success) {
      alert(result.error || "Error al eliminar el gasto");
    }
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay gastos en este período</p>
      </div>
    );
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = expense.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, ExpenseWithItems[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateHeader(date)}
          </h3>
          <div className="space-y-2">
            {dateExpenses.map((expense) => {
              const hasItems = expense.items && expense.items.length > 0;
              const isExpanded = expandedIds.has(expense.id);
              
              return (
                <div
                  key={expense.id}
                  className="bg-card rounded-lg border overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{expense.description}</p>
                        {hasItems && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(expense.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={isExpanded ? "Ocultar items" : "Ver items"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {expense.category || "Sin categoría"}
                        {hasItems && expense.items && ` • ${expense.items.length} items`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-lg font-semibold whitespace-nowrap">
                        {expense.amount.toFixed(2)}€
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        aria-label="Eliminar gasto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line items (lineas de compra) */}
                  {hasItems && isExpanded && expense.items && (
                    <div className="border-t bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Líneas de compra:
                      </p>
                      <div className="space-y-1">
                        {expense.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-foreground/90">
                              {item.quantity > 1 && `${item.quantity}x `}
                              {item.name}
                            </span>
                            <span className="text-muted-foreground">
                              {item.price.toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Compare date strings directly for efficiency
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) {
    return "Hoy";
  }
  if (dateStr === yesterdayStr) {
    return "Ayer";
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}


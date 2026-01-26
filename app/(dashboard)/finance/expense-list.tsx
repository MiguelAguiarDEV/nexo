"use client";

import type { Expense } from "@/types/db";
import { formatDistanceToNow } from "@/lib/utils/date";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "./actions";
import { useState } from "react";

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
  }, {} as Record<string, Expense[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {formatDateHeader(date)}
          </h3>
          <div className="space-y-2">
            {dateExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category || "Sin categoría"}
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
            ))}
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

  const dateOnly = date.toISOString().split('T')[0];
  const todayOnly = today.toISOString().split('T')[0];
  const yesterdayOnly = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayOnly) {
    return "Hoy";
  }
  if (dateOnly === yesterdayOnly) {
    return "Ayer";
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

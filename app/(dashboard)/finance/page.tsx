import { Suspense } from "react";
import { getExpenses, getExpenseSummary } from "./actions";
import { FinancePageClient } from "./finance-page-client";

export default async function FinancePage() {
  // Load initial data with default period (month)
  const [expenses, summary] = await Promise.all([
    getExpenses("month"),
    getExpenseSummary("month"),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Finanzas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestión de gastos compartidos y personales
            {summary.count > 0 && ` • ${summary.count} gastos`}
          </p>
        </div>

        {/* Client component with all interactive elements */}
        <Suspense fallback={<div>Cargando...</div>}>
          <FinancePageClient initialExpenses={expenses} initialSummary={summary} />
        </Suspense>
      </div>
    </div>
  );
}

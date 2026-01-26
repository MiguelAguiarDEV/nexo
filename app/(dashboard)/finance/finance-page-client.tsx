"use client";

import { useState, useTransition } from "react";
import { TimePeriodFilter, type TimePeriod } from "./time-period-filter";
import { ExpenseList } from "./expense-list";
import { SummaryCards } from "./summary-cards";
import { CSVImport } from "./csv-import";
import type { ExpenseWithItems } from "./actions";
import { getExpenses, getExpenseSummary } from "./actions";

interface FinancePageClientProps {
  initialExpenses: ExpenseWithItems[];
  initialSummary: {
    total: number;
    count: number;
    average: number;
    byCategory: Array<{
      category: string;
      total: number;
      count: number;
      average: number;
    }>;
  };
}

export function FinancePageClient({ initialExpenses, initialSummary }: FinancePageClientProps) {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [expenses, setExpenses] = useState(initialExpenses);
  const [summary, setSummary] = useState(initialSummary);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    
    startTransition(async () => {
      const [newExpenses, newSummary] = await Promise.all([
        getExpenses(newPeriod),
        getExpenseSummary(newPeriod),
      ]);
      setExpenses(newExpenses);
      setSummary(newSummary);
    });
  };

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <TimePeriodFilter value={period} onChange={handlePeriodChange} />

      {/* Summary Cards */}
      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <SummaryCards
          total={summary.total}
          count={summary.count}
          average={summary.average}
          byCategory={summary.byCategory}
        />
      </div>

      {/* CSV Import */}
      <div className="border-t pt-6">
        <CSVImport />
      </div>

      {/* Expense List */}
      <div className={`border-t pt-6 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <h2 className="text-xl font-semibold mb-4">Historial de gastos</h2>
        <ExpenseList expenses={expenses} />
      </div>
    </div>
  );
}

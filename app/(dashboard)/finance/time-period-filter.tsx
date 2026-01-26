"use client";

import { cn } from "@/lib/utils";

export type TimePeriod = "all" | "month" | "week" | "day";

interface TimePeriodFilterProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "all", label: "Todo" },
];

export function TimePeriodFilter({ value, onChange }: TimePeriodFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {periods.map((period) => (
        <button
          key={period.value}
          type="button"
          onClick={() => onChange(period.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
            value === period.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

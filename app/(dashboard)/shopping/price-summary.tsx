"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "@/types/db";
import { Calculator, X } from "lucide-react";
import { useMemo } from "react";

interface PriceSummaryProps {
  items: ShoppingItem[];
  selectedIds: Set<number>;
  onClearSelection: () => void;
}

export function PriceSummary({
  items,
  selectedIds,
  onClearSelection,
}: PriceSummaryProps) {
  // Format price
  const formatPrice = (price: number, currency = "EUR") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(price);
  };

  // Calculate totals
  const { totalAll, totalSelected, selectedCount, itemsWithPrice } =
    useMemo(() => {
      const uncheckedItems = items.filter((item) => !item.is_checked);

      const itemsWithPrice = uncheckedItems.filter(
        (item) => item.price !== null && item.price > 0
      );

      const totalAll = itemsWithPrice.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * item.quantity;
        return sum + itemTotal;
      }, 0);

      const selectedItems = itemsWithPrice.filter((item) =>
        selectedIds.has(item.id)
      );
      const totalSelected = selectedItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * item.quantity;
        return sum + itemTotal;
      }, 0);

      return {
        totalAll,
        totalSelected,
        selectedCount: selectedIds.size,
        itemsWithPrice: itemsWithPrice.length,
      };
    }, [items, selectedIds]);

  // Don't show if no items have prices
  if (itemsWithPrice === 0) {
    return null;
  }

  const hasSelection = selectedCount > 0;
  const displayTotal = hasSelection ? totalSelected : totalAll;
  const displayLabel = hasSelection
    ? `${selectedCount} seleccionado${selectedCount > 1 ? "s" : ""}`
    : `${itemsWithPrice} producto${itemsWithPrice > 1 ? "s" : ""} con precio`;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-4 transition-all",
        hasSelection
          ? "border-foreground bg-foreground text-background"
          : "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">Total estimado</p>
          <p
            className={cn(
              "text-xs",
              hasSelection ? "text-background/70" : "text-muted-foreground"
            )}
          >
            {displayLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold tabular-nums">
          {formatPrice(displayTotal)}
        </span>

        {hasSelection && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-background hover:text-background hover:bg-background/20"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

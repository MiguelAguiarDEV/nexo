"use client";

import type { ItemType, ShoppingItem } from "@/types/db";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AddItemDrawer } from "./add-item-drawer";
import { ClearCheckedButton } from "./clear-checked-button";
import { PriceSummary } from "./price-summary";
import { ShoppingList } from "./shopping-list";
import { TypeFilter } from "./type-filter";

interface ShoppingPageClientProps {
  items: ShoppingItem[];
  counts: Record<ItemType | "all", number>;
}

export function ShoppingPageClient({ items, counts }: ShoppingPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selection state for price calculation
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Get current type filter from URL
  const currentType = (searchParams.get("type") as ItemType) || null;

  // Filter items for display
  const filteredItems = currentType
    ? items.filter((item) => item.type === currentType)
    : items;

  // Check if there are any checked items (considering filter)
  const hasChecked = filteredItems.some((item) => item.is_checked);

  // Handle type change
  const handleTypeChange = useCallback(
    (type: ItemType | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (type) {
        params.set("type", type);
      } else {
        params.delete("type");
      }
      // Clear selection when changing filter
      setSelectedIds(new Set());
      router.push(`/shopping?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Toggle item selection
  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <div className="space-y-4 pb-24">
      {/* Price summary */}
      <PriceSummary
        items={filteredItems}
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
      />

      {/* Type filter */}
      <TypeFilter
        currentType={currentType}
        counts={counts}
        onTypeChange={handleTypeChange}
      />

      {/* Clear checked button */}
      {hasChecked && (
        <div className="flex justify-end">
          <ClearCheckedButton
            hasChecked={hasChecked}
            typeFilter={currentType}
          />
        </div>
      )}

      {/* Shopping list */}
      <ShoppingList
        items={items}
        typeFilter={currentType}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      {/* Floating add button */}
      <AddItemDrawer defaultType={currentType || undefined} />
    </div>
  );
}

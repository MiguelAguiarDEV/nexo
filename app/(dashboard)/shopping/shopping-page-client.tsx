"use client";

import type { ItemType, ShoppingItem } from "@/types/db";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AddItemDrawer } from "./add-item-drawer";
import { ClearCheckedButton } from "./clear-checked-button";
import { PriceSummary } from "./price-summary";
import { ShoppingList } from "./shopping-list";
import { TypeFilter } from "./type-filter";
import { ScannerModal } from "@/components/shopping/scanner-modal";

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
    <div className="flex flex-col h-full space-y-4">
      {/* Price summary - Fixed */}
      <div className="shrink-0">
        <PriceSummary
          items={filteredItems}
          selectedIds={selectedIds}
          onClearSelection={handleClearSelection}
        />
      </div>

      {/* Type filter - Fixed */}
      <div className="shrink-0">
        <TypeFilter
          currentType={currentType}
          counts={counts}
          onTypeChange={handleTypeChange}
        />
      </div>

      {/* Clear checked button - Fixed */}
      {hasChecked && (
        <div className="flex justify-end shrink-0">
          <ClearCheckedButton
            hasChecked={hasChecked}
            typeFilter={currentType}
          />
        </div>
      )}

      {/* Shopping list - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
        <ShoppingList
          items={items}
          typeFilter={currentType}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse gap-3 pb-[env(safe-area-inset-bottom)]">
         <AddItemDrawer 
           defaultType={currentType || undefined} 
           triggerClassName="static h-14 w-14"
         />
         <ScannerModal />
      </div>

    </div>
  );
}

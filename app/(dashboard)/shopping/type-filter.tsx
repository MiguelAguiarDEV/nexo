"use client";

import { Button } from "@/components/ui/button";
import { ITEM_TYPE_CONFIG } from "@/lib/constants/shopping";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/types/db";
import { ITEM_TYPES } from "@/types/db";
import {
  Bath,
  ChefHat,
  Home,
  LayoutGrid,
  Package,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

// Icon mapping
const TYPE_ICONS: Record<ItemType | "all", React.ElementType> = {
  all: LayoutGrid,
  food: UtensilsCrossed,
  kitchen: ChefHat,
  bathroom: Bath,
  cleaning: Sparkles,
  clothing: Shirt,
  electronics: Smartphone,
  home: Home,
  other: Package,
};

interface TypeFilterProps {
  currentType: ItemType | null;
  counts: Record<ItemType | "all", number>;
  onTypeChange: (type: ItemType | null) => void;
}

export function TypeFilter({
  currentType,
  counts,
  onTypeChange,
}: TypeFilterProps) {
  const AllIcon = TYPE_ICONS.all;

  return (
    <div className="flex flex-wrap gap-2">
      {/* All button */}
      <Button
        variant={currentType === null ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => onTypeChange(null)}
      >
        <AllIcon className="h-3.5 w-3.5" />
        <span>Todos</span>
        {counts.all > 0 && (
          <span className="ml-1 text-xs opacity-70">({counts.all})</span>
        )}
      </Button>

      {/* Type buttons - only show types with items */}
      {ITEM_TYPES.map((type) => {
        const count = counts[type] || 0;
        const Icon = TYPE_ICONS[type];
        const config = ITEM_TYPE_CONFIG[type];

        // Only show types that have items or is currently selected
        if (count === 0 && currentType !== type) return null;

        return (
          <Button
            key={type}
            variant={currentType === type ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              currentType !== type && "hover:border-current"
            )}
            style={
              currentType !== type ? { borderColor: "transparent" } : undefined
            }
            onClick={() => onTypeChange(type)}
          >
            <Icon
              className="h-3.5 w-3.5"
              style={currentType !== type ? { color: config.color } : undefined}
            />
            <span>{config.label}</span>
            {count > 0 && (
              <span className="ml-1 text-xs opacity-70">({count})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

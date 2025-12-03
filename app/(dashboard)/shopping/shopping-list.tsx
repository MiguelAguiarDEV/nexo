"use client";

import { Button } from "@/components/ui/button";
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from "@/lib/constants/shopping";
import { cn } from "@/lib/utils";
import type { ItemType, ShoppingItem } from "@/types/db";
import {
  Bath,
  Check,
  ChefHat,
  ExternalLink,
  Home,
  Loader2,
  Minus,
  Package,
  Plus,
  Shirt,
  Smartphone,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useOptimistic, useTransition } from "react";
import {
  deleteShoppingItem,
  toggleShoppingItem,
  updateShoppingItemQuantity,
} from "./actions";

// Icon mapping
const TYPE_ICONS: Record<ItemType, React.ElementType> = {
  food: UtensilsCrossed,
  kitchen: ChefHat,
  bathroom: Bath,
  cleaning: Sparkles,
  clothing: Shirt,
  electronics: Smartphone,
  home: Home,
  other: Package,
};

interface ShoppingListProps {
  items: ShoppingItem[];
  typeFilter?: ItemType | null;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
}

export function ShoppingList({
  items,
  typeFilter,
  selectedIds,
  onToggleSelect,
}: ShoppingListProps) {
  const [optimisticItems, updateOptimistic] = useOptimistic(
    items,
    (
      state,
      update: {
        type: "toggle" | "delete" | "quantity";
        id: number;
        quantity?: number;
      }
    ) => {
      switch (update.type) {
        case "toggle":
          return state.map((item) =>
            item.id === update.id
              ? { ...item, is_checked: !item.is_checked }
              : item
          );
        case "delete":
          return state.filter((item) => item.id !== update.id);
        case "quantity":
          return state.map((item) =>
            item.id === update.id
              ? { ...item, quantity: update.quantity! }
              : item
          );
        default:
          return state;
      }
    }
  );

  // Filter items if typeFilter is set
  const filteredItems = typeFilter
    ? optimisticItems.filter((item) => item.type === typeFilter)
    : optimisticItems;

  const unchecked = filteredItems.filter((item) => !item.is_checked);
  const checked = filteredItems.filter((item) => item.is_checked);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">
          {typeFilter
            ? `No hay productos de tipo "${ITEM_TYPE_CONFIG[typeFilter].label}"`
            : "No hay productos en la lista"}
        </p>
        <p className="text-xs mt-1">
          Añade algo usando el formulario de arriba
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <ul className="space-y-2">
          {unchecked.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onOptimisticUpdate={updateOptimistic}
              showType={!typeFilter}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => onToggleSelect(item.id)}
            />
          ))}
        </ul>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Completados ({checked.length})
          </h3>
          <ul className="space-y-2 opacity-60">
            {checked.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onOptimisticUpdate={updateOptimistic}
                showType={!typeFilter}
                isSelected={false}
                onToggleSelect={() => {}}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ShoppingItemRowProps {
  item: ShoppingItem;
  showType?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOptimisticUpdate: (update: {
    type: "toggle" | "delete" | "quantity";
    id: number;
    quantity?: number;
  }) => void;
}

function ShoppingItemRow({
  item,
  showType = true,
  isSelected,
  onToggleSelect,
  onOptimisticUpdate,
}: ShoppingItemRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      onOptimisticUpdate({ type: "toggle", id: item.id });
      await toggleShoppingItem(item.id);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      onOptimisticUpdate({ type: "delete", id: item.id });
      await deleteShoppingItem(item.id);
    });
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;

    startTransition(async () => {
      onOptimisticUpdate({
        type: "quantity",
        id: item.id,
        quantity: newQuantity,
      });
      await updateShoppingItemQuantity(item.id, newQuantity);
    });
  };

  const TypeIcon = TYPE_ICONS[item.type];
  const typeConfig = ITEM_TYPE_CONFIG[item.type];
  const priorityConfig = PRIORITY_CONFIG[item.priority];

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
    }).format(price);
  };

  // Calculate item total
  const itemTotal =
    item.price !== null && item.price > 0 ? item.price * item.quantity : null;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-all cursor-pointer",
        item.is_checked && "bg-muted/50 cursor-default",
        isSelected &&
          !item.is_checked &&
          "border-foreground ring-1 ring-foreground",
        isPending && "opacity-70"
      )}
      onClick={() => !item.is_checked && onToggleSelect()}
    >
      {/* Check button */}
      <Button
        variant={item.is_checked ? "default" : "outline"}
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className={cn("h-4 w-4", !item.is_checked && "opacity-0")} />
        )}
      </Button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          {item.priority < 3 && (
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                item.priority === 1 && "bg-red-500",
                item.priority === 2 && "bg-orange-500"
              )}
              title={priorityConfig.label}
            />
          )}

          {/* Name */}
          <span
            className={cn(
              "font-medium truncate",
              item.is_checked && "line-through text-muted-foreground"
            )}
          >
            {item.name}
          </span>

          {/* Type badge */}
          {showType && (
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"
              title={typeConfig.label}
            >
              <TypeIcon
                className="h-3 w-3"
                style={{ color: typeConfig.color }}
              />
            </span>
          )}

          {/* URL indicator */}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Secondary info row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {/* Quantity and unit */}
          {(item.quantity > 1 || item.unit) && (
            <span>
              {item.quantity}
              {item.unit && ` ${item.unit}`}
            </span>
          )}

          {/* Price per unit */}
          {item.price !== null && item.price > 0 && (
            <>
              {item.quantity > 1 && <span>×</span>}
              <span>{formatPrice(item.price, item.currency)}</span>
            </>
          )}

          {/* Notes */}
          {item.notes && (
            <>
              <span>•</span>
              <span className="truncate max-w-[150px]" title={item.notes}>
                {item.notes}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Item total price */}
      {itemTotal !== null && !item.is_checked && (
        <div className="text-right shrink-0">
          <span className="font-semibold tabular-nums">
            {formatPrice(itemTotal, item.currency)}
          </span>
        </div>
      )}

      {/* Quantity controls */}
      {!item.is_checked && (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(-1)}
            disabled={isPending || item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(1)}
            disabled={isPending}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

// Legacy export
export const GroceryList = ShoppingList;

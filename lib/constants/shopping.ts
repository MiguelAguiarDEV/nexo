import type { ItemType, Priority } from "@/types/db";

// Item type configuration with labels and icons (lucide icon names)
export const ITEM_TYPE_CONFIG: Record<
  ItemType,
  { label: string; icon: string; color: string }
> = {
  food: { label: "Comida", icon: "UtensilsCrossed", color: "#22c55e" },
  kitchen: { label: "Cocina", icon: "ChefHat", color: "#f97316" },
  bathroom: { label: "Baño", icon: "Bath", color: "#3b82f6" },
  cleaning: { label: "Limpieza", icon: "Sparkles", color: "#a855f7" },
  clothing: { label: "Ropa", icon: "Shirt", color: "#ec4899" },
  electronics: { label: "Electrónica", icon: "Smartphone", color: "#6366f1" },
  home: { label: "Hogar", icon: "Home", color: "#14b8a6" },
  other: { label: "Otros", icon: "Package", color: "#71717a" },
};

// Priority configuration
export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; badge: string }
> = {
  1: { label: "Urgente", color: "#ef4444", badge: "bg-red-500" },
  2: { label: "Alta", color: "#f97316", badge: "bg-orange-500" },
  3: { label: "Normal", color: "#71717a", badge: "bg-zinc-500" },
  4: { label: "Baja", color: "#a1a1aa", badge: "bg-zinc-400" },
};

// Default values for new items
export const DEFAULT_ITEM_TYPE: ItemType = "other";
export const DEFAULT_PRIORITY: Priority = 3;
export const DEFAULT_CURRENCY = "EUR";

// Common units for different item types
export const COMMON_UNITS: Record<ItemType, string[]> = {
  food: ["kg", "g", "L", "ml", "unidad", "pack", "docena"],
  kitchen: ["unidad", "set", "pack"],
  bathroom: ["unidad", "pack", "L", "ml"],
  cleaning: ["unidad", "L", "ml", "pack"],
  clothing: ["unidad", "par", "pack"],
  electronics: ["unidad"],
  home: ["unidad", "set", "pack", "m", "m²"],
  other: ["unidad", "pack"],
};

// Food subcategories
export const FOOD_CATEGORIES = [
  "Frutas y verduras",
  "Carnes",
  "Pescados",
  "Lácteos",
  "Panadería",
  "Bebidas",
  "Congelados",
  "Despensa",
  "Snacks",
  "Otros",
];

// Kitchen subcategories
export const KITCHEN_CATEGORIES = [
  "Utensilios",
  "Electrodomésticos",
  "Almacenamiento",
  "Vajilla",
  "Otros",
];

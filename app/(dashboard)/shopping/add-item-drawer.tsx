"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ITEM_TYPE_CONFIG } from "@/lib/constants/shopping";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/types/db";
import { ITEM_TYPES } from "@/types/db";
import {
  Bath,
  ChefHat,
  Home,
  Loader2,
  Package,
  Plus,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useState, useTransition } from "react";
import { addShoppingItem } from "./actions";

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

interface AddItemDrawerProps {
  defaultType?: ItemType;
}

export function AddItemDrawer({ defaultType }: AddItemDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>(defaultType || "food");
  const [price, setPrice] = useState("");

  const resetForm = () => {
    setName("");
    setType(defaultType || "food");
    setPrice("");
    setError(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Escribe el nombre del producto");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("type", type);
    formData.set("price", price || "0");
    formData.set("quantity", "1");
    formData.set("priority", "3");
    formData.set("currency", "EUR");

    startTransition(async () => {
      const result = await addShoppingItem(formData);

      if (result.success) {
        resetForm();
        setOpen(false);
      } else {
        setError(result.error || "Error al añadir");
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Añadir producto</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 space-y-6">
            {/* Name input */}
            <div className="space-y-2">
              <Input
                placeholder="¿Qué necesitas comprar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="text-lg h-12"
              />
            </div>

            {/* Type selector - Grid de iconos */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tipo</p>
              <div className="grid grid-cols-4 gap-2">
                {ITEM_TYPES.map((t) => {
                  const Icon = TYPE_ICONS[t];
                  const config = ITEM_TYPE_CONFIG[t];
                  const isSelected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-transparent bg-muted hover:bg-muted/80"
                      )}
                    >
                      <Icon
                        className="h-6 w-6 mb-1"
                        style={
                          !isSelected ? { color: config.color } : undefined
                        }
                      />
                      <span className="text-[11px] font-medium">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price input */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Precio estimado</p>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-lg h-12 pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <DrawerFooter>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="h-12 text-base"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              Añadir a la lista
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-12">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

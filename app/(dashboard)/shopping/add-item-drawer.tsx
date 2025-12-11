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
import { URLPreview } from "@/components/url-preview";
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
  triggerClassName?: string;
}

export function AddItemDrawer({ defaultType, triggerClassName }: AddItemDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ItemType>(defaultType || "food");
  const [price, setPrice] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setUrl("");
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
    if (description.trim()) formData.set("notes", description.trim());
    if (url.trim()) formData.set("url", url.trim());

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
          className={cn(
            "h-14 w-14 rounded-full shadow-lg z-40",
            triggerClassName || "fixed bottom-24 lg:bottom-6 right-6"
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[92vh] flex flex-col p-0">
        <div className="mx-auto w-full max-w-md flex flex-col h-full">
          <DrawerHeader className="py-2 px-4 flex-shrink-0">
            <DrawerTitle className="text-base">Añadir producto</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-2">
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
              <p className="text-xs text-muted-foreground">Tipo</p>
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
                        "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all text-[10px]",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-transparent bg-muted hover:bg-muted/80"
                      )}
                    >
                      <Icon
                        className="h-5 w-5 mb-0.5"
                        style={
                          !isSelected ? { color: config.color } : undefined
                        }
                      />
                      <span className="font-medium leading-tight">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price input */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Precio estimado</p>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-base h-10 pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
            </div>

            {/* Description input */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Descripción (opcional)
              </p>
              <textarea
                placeholder="Detalles del producto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none h-12"
              />
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                URL del producto (opcional)
              </p>
              <Input
                type="url"
                placeholder="https://example.com/product"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-sm h-10"
              />
              {url && (
                <div className="mt-1 border rounded-lg overflow-hidden bg-muted/30 text-xs h-20 overflow-hidden flex-shrink-0">
                  <URLPreview url={url} />
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
          </div>

          <DrawerFooter className="border-t py-2 px-4 gap-1.5 flex-shrink-0">
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="h-9 text-xs w-full"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1.5" />
              )}
              Añadir
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-9 text-xs w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

import { Suspense } from "react";
import { getItemCountsByType, getShoppingItems } from "./actions";
import { ShoppingPageClient } from "./shopping-page-client";

export default async function ShoppingPage() {
  const [items, counts] = await Promise.all([
    getShoppingItems(),
    getItemCountsByType(),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-5rem)] lg:h-[calc(100vh-4rem)] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Lista de compra
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona tus compras de cualquier tipo
            {counts.all > 0 && ` • ${counts.all} pendientes`}
          </p>
        </div>

        {/* Client component with all interactive elements */}
        <Suspense fallback={<div>Cargando...</div>}>
          <ShoppingPageClient items={items} counts={counts} />
        </Suspense>
      </div>
    </div>
  );
}

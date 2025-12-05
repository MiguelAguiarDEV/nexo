import { Suspense } from "react";
import { getItemCountsByType, getShoppingItems } from "./actions";
import { ShoppingPageClient } from "./shopping-page-client";

export default async function ShoppingPage() {
  const [items, counts] = await Promise.all([
    getShoppingItems(),
    getItemCountsByType(),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
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

"use client";

import { Button } from "@/components/ui/button";
import type { ItemType } from "@/types/db";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { clearCheckedItems } from "./actions";

interface ClearCheckedButtonProps {
  hasChecked: boolean;
  typeFilter?: ItemType | null;
}

export function ClearCheckedButton({
  hasChecked,
  typeFilter,
}: ClearCheckedButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!hasChecked) {
    return null;
  }

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearCheckedItems(typeFilter || undefined);
      if (result.success && result.count) {
        setMessage(`${result.count} eliminados`);
        setTimeout(() => setMessage(null), 2000);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleClear}
        disabled={isPending}
        className="text-muted-foreground hover:text-destructive"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-2" />
        )}
        Limpiar completados
      </Button>
    </div>
  );
}

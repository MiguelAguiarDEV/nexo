"use client";

import { importExpensesFromCSV } from "./actions";
import { useState } from "react";
import { Upload } from "lucide-react";

export function CSVImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported?: number;
    skipped?: number;
    error?: string;
  } | null>(null);

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImporting(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const response = await importExpensesFromCSV(formData);
    
    setImporting(false);
    setResult(response);

    if (response.success) {
      // Reset form
      e.currentTarget.reset();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label
            htmlFor="csv-file"
            className="block text-sm font-medium mb-2"
          >
            Importar gastos desde CSV
          </label>
          <div className="flex gap-2">
            <input
              id="csv-file"
              name="csv"
              type="file"
              accept=".csv"
              required
              disabled={importing}
              className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={importing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importando..." : "Importar"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Formato CSV: fecha,cantidad,descripción,categoría (una por línea)
          </p>
        </div>
      </form>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? "bg-green-50 text-green-900 border border-green-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {result.success ? (
            <p>
              ✓ Importados: {result.imported} gastos
              {result.skipped ? ` • Omitidos: ${result.skipped}` : ""}
            </p>
          ) : (
            <p>✗ {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

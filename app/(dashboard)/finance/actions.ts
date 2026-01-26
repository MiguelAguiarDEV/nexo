"use server";

import { getSafeAuth, getScope } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Expense, ExpenseItem } from "@/types/db";
import { revalidatePath } from "next/cache";

// Time period type
export type TimePeriod = "all" | "month" | "week" | "day";

// Expense with items
export interface ExpenseWithItems extends Expense {
  items?: ExpenseItem[];
}

// Helper to map DB row to Expense
function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as number,
    amount: row.amount as number,
    description: row.description as string,
    category: row.category as string | null,
    date: row.date as string,
    payer_id: row.payer_id as string,
    org_id: row.org_id as string | null,
    created_at: row.created_at as string,
  };
}

// Get date range for time period
function getDateRange(period: TimePeriod): { start: string; end: string } | null {
  const now = new Date();
  const start = new Date(now);
  
  switch (period) {
    case "day":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "all":
      return null;
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
}

// Get expenses with optional time period filter
export async function getExpenses(
  period: TimePeriod = "month"
): Promise<ExpenseWithItems[]> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  let sql: string;
  const args: (string | number | null)[] = [];

  // Build base query based on scope
  if (scope === "household" && orgId) {
    sql = `SELECT * FROM expenses WHERE org_id = ?`;
    args.push(orgId);
  } else {
    sql = `SELECT * FROM expenses WHERE payer_id = ? AND org_id IS NULL`;
    args.push(userId);
  }

  // Add date range filter if not "all"
  const dateRange = getDateRange(period);
  if (dateRange) {
    sql += ` AND date >= ? AND date <= ?`;
    args.push(dateRange.start, dateRange.end);
  }

  sql += ` ORDER BY date DESC, created_at DESC`;

  const result = await db.execute({ sql, args });
  const expenses: ExpenseWithItems[] = result.rows.map((row) => rowToExpense(row as Record<string, unknown>));
  
  // Fetch items for each expense
  for (const expense of expenses) {
    const itemsResult = await db.execute({
      sql: `SELECT * FROM expense_items WHERE expense_id = ? ORDER BY created_at ASC`,
      args: [expense.id],
    });
    
    if (itemsResult.rows.length > 0) {
      expense.items = itemsResult.rows.map(row => ({
        id: row.id as number,
        expense_id: row.expense_id as number,
        name: row.name as string,
        quantity: row.quantity as number,
        price: row.price as number,
        created_at: row.created_at as string,
      }));
    }
  }
  
  return expenses;
}

// Get expense summary (total, count, average by category)
export async function getExpenseSummary(period: TimePeriod = "month") {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  let sql: string;
  const args: (string | number | null)[] = [];

  // Build base query
  if (scope === "household" && orgId) {
    sql = `SELECT 
            COUNT(*) as count,
            SUM(amount) as total,
            AVG(amount) as average,
            category
          FROM expenses 
          WHERE org_id = ?`;
    args.push(orgId);
  } else {
    sql = `SELECT 
            COUNT(*) as count,
            SUM(amount) as total,
            AVG(amount) as average,
            category
          FROM expenses 
          WHERE payer_id = ? AND org_id IS NULL`;
    args.push(userId);
  }

  // Add date range filter
  const dateRange = getDateRange(period);
  if (dateRange) {
    sql += ` AND date >= ? AND date <= ?`;
    args.push(dateRange.start, dateRange.end);
  }

  sql += ` GROUP BY category`;

  const result = await db.execute({ sql, args });
  
  const total = result.rows.reduce((sum, row) => sum + ((row.total as number) || 0), 0);
  const count = result.rows.reduce((sum, row) => sum + ((row.count as number) || 0), 0);
  const byCategory = result.rows.map(row => ({
    category: (row.category as string) || "Sin categoría",
    total: (row.total as number) || 0,
    count: (row.count as number) || 0,
    average: (row.average as number) || 0,
  }));

  return {
    total,
    count,
    average: count > 0 ? total / count : 0,
    byCategory,
  };
}

// Import expenses from CSV
export async function importExpensesFromCSV(
  formData: FormData
): Promise<{ success: boolean; error?: string; imported?: number; skipped?: number }> {
  const { userId, orgId } = await getSafeAuth();
  
  const file = formData.get("csv") as File;
  if (!file) {
    return { success: false, error: "No se proporcionó ningún archivo" };
  }

  try {
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    if (lines.length === 0) {
      return { success: false, error: "El archivo CSV está vacío" };
    }

    // Skip header line if it exists
    const dataLines = lines[0].toLowerCase().includes("date") || lines[0].toLowerCase().includes("fecha") 
      ? lines.slice(1) 
      : lines;

    let imported = 0;
    let skipped = 0;

    for (const line of dataLines) {
      const parts = line.split(",").map(p => p.trim());
      
      if (parts.length < 3) {
        skipped++;
        continue;
      }

      const [date, amount, description, category = "Imported"] = parts;
      
      // Validate data
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        skipped++;
        continue;
      }

      // Check for duplicates (same date, amount, and description)
      const duplicateCheck = await db.execute({
        sql: `SELECT id FROM expenses WHERE date = ? AND amount = ? AND description = ? AND payer_id = ?`,
        args: [date, parsedAmount, description, userId],
      });

      if (duplicateCheck.rows.length > 0) {
        skipped++;
        continue;
      }

      // Insert expense
      await db.execute({
        sql: `INSERT INTO expenses (date, amount, description, category, payer_id, org_id) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [date, parsedAmount, description, category, userId, orgId || null],
      });

      imported++;
    }

    revalidatePath("/finance");
    return { success: true, imported, skipped };
  } catch (error) {
    console.error("Error importing CSV:", error);
    return { 
      success: false, 
      error: "Error al procesar el archivo CSV: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Delete an expense
export async function deleteExpense(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  try {
    const existing = await db.execute({
      sql: `SELECT * FROM expenses WHERE id = ?`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return { success: false, error: "Gasto no encontrado" };
    }

    const expense = existing.rows[0];

    // Verify access
    if (scope === "household") {
      if (expense.org_id !== orgId) {
        return { success: false, error: "No tienes acceso a este gasto" };
      }
    } else {
      if (expense.payer_id !== userId || expense.org_id !== null) {
        return { success: false, error: "No tienes acceso a este gasto" };
      }
    }

    // Delete expense items first (will cascade, but being explicit)
    await db.execute({
      sql: `DELETE FROM expense_items WHERE expense_id = ?`,
      args: [id],
    });

    // Delete expense
    await db.execute({
      sql: `DELETE FROM expenses WHERE id = ?`,
      args: [id],
    });

    revalidatePath("/finance");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Error al eliminar el gasto" };
  }
}

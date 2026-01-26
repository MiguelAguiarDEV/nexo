import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { type ReceiptData } from "@/lib/services/scan";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CreateExpenseParams {
  receipt: ReceiptData;
  userId: string;
  orgId: string | null;
}

export interface CreateExpenseResult {
  expenseId: number;
}

// ============================================================================
// Finance Service
// ============================================================================

export class FinanceService {
  /**
   * Ensures the user exists in the local database to satisfy FK constraints.
   * If not, it syncs basic info from Clerk.
   */
  static async ensureUserExists(userId: string) {
    // Check if user exists
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE id = ?",
      args: [userId],
    });

    if (existing.rows.length > 0) {
      return;
    }

    console.log(`FinanceService: Syncing user ${userId} to local DB...`);
    
    // Fetch user details from Clerk
    // We try/catch this because if it fails we still want to try inserting with placeholders
    // to avoid blocking the user flow, though email is required usually.
    try {
      const user = await currentUser();
      if (!user || user.id !== userId) {
        // This mismatch shouldn't happen if userId comes from auth(), but safe to check
        console.warn("FinanceService: Current user mismatch or null");
      }

      const email = user?.emailAddresses[0]?.emailAddress || "unknown@nexo.app";
      const name = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User";
      const avatarUrl = user?.imageUrl || null;

      await db.execute({
        sql: `INSERT OR IGNORE INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)`,
        args: [userId, email, name, avatarUrl],
      });
      console.log("FinanceService: User synced successfully");

    } catch (error) {
      console.error("FinanceService: Error syncing user:", error);
      // Fallback: Insert with placeholder if we can't get details (though email NOT NULL constraint might fail if we don't have one)
      // Assuming email is NOT NULL in schema.
      await db.execute({
        sql: `INSERT INTO users (id, email, name) VALUES (?, ?, ?)`,
        args: [userId, "fallback@nexo.app", "User"],
      });
    }
  }

  /**
   * Creates an expense from receipt data
   * 
   * @param params - Typed parameters for expense creation
   * @returns CreateExpenseResult with the new expense ID
   */
  static async createExpenseFromReceipt(params: CreateExpenseParams): Promise<CreateExpenseResult> {
    const { receipt, userId, orgId } = params;
    console.log("FinanceService: Creating expense...");
    
    // CRITICAL: Ensure user exists to prevent FK violation
    await this.ensureUserExists(userId);

    // If orgId is present, ensure it exists too (optional but good practice)
    // For now assuming org sync handling is separate or implicit via webhooks

    const result = await db.execute({
      sql: `INSERT INTO expenses (amount, description, category, date, payer_id, org_id) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        receipt.total,
        `Compra en ${receipt.store}`, // Description
        "Groceries", // Category
        receipt.date,
        userId,
        orgId || null
      ]
    });
    
    const expenseId = Number(result.lastInsertRowid);
    console.log(`FinanceService: Expense created successfully with ID ${expenseId}`);
    
    // Store line items (lineas de compra)
    if (receipt.items && receipt.items.length > 0) {
      console.log(`FinanceService: Storing ${receipt.items.length} line items...`);
      for (const item of receipt.items) {
        await db.execute({
          sql: `INSERT INTO expense_items (expense_id, name, quantity, price) VALUES (?, ?, ?, ?)`,
          args: [expenseId, item.name, item.quantity || 1, item.price]
        });
      }
      console.log("FinanceService: Line items stored successfully");
    }
    
    return { expenseId };
  }
}


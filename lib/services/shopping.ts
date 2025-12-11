import { db } from "@/lib/db";
import type { ReceiptItem } from "@/lib/services/scan";

export interface MatchResult {
  matchedItemsCount: number;
}

export class ShoppingService {
  /**
   * fuzzy matches receipt items against active shopping list items
   * and checks them off in the database.
   */
  static async checkOffItemsFromReceipt(
    receiptItems: ReceiptItem[],
    userId: string,
    orgId: string | null
  ): Promise<MatchResult> {
    console.log("ShoppingService: Checking off items...");

    // 1. Fetch active shopping items (is_checked = 0)
    const scopeClause = orgId 
      ? "org_id = ?" 
      : "created_by = ? AND org_id IS NULL";
    const scopeParams = orgId ? [orgId] : [userId];

    const { rows } = await db.execute({
      sql: `SELECT id, name FROM shopping_items WHERE is_checked = 0 AND ${scopeClause}`,
      args: scopeParams,
    });

    // 2. Fuzzy match and update items
    const updates: Promise<any>[] = [];
    const matchedItemIds: number[] = [];

    for (const row of rows) {
      const dbItemName = (row.name as string).toLowerCase();
      
      // Look for a receipt item that "contains" the DB item name
      // Normalization: removing accents could improve this further
      const match = receiptItems.find(receiptItem => 
        receiptItem.name.toLowerCase().includes(dbItemName)
      );

      if (match) {
        console.log(`ShoppingService: Matched DB item "${row.name}" with Receipt item "${match.name}"`);
        matchedItemIds.push(row.id as number);
        updates.push(
          db.execute({
            sql: `UPDATE shopping_items SET is_checked = 1, price = ?, checked_by = ?, checked_at = datetime('now') WHERE id = ?`,
            args: [match.price, userId, row.id],
          })
        );
      }
    }

    await Promise.all(updates);
    return { matchedItemsCount: matchedItemIds.length };
  }
}

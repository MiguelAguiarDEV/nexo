import { db } from "@/lib/db";
import type { ReceiptItem } from "@/lib/services/scan";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MatchResult {
  matchedItemsCount: number;
}

export interface AddToShoppingParams {
  items: ReceiptItem[];
  userId: string;
  orgId: string | null;
}

export interface AddToShoppingResult {
  addedCount: number;
  addedIds: number[];
}

// ============================================================================
// Shopping Service
// ============================================================================

export class ShoppingService {
  /**
   * Adds items from a receipt to the shopping list.
   * Only adds items that don't already exist in the list.
   * Items are immediately marked as "checked" since they were just purchased.
   */
  static async addItemsFromReceipt(params: AddToShoppingParams): Promise<AddToShoppingResult> {
    const { items, userId, orgId } = params;
    console.log("ShoppingService: Adding items from receipt...");

    const scopeClause = orgId 
      ? "org_id = ?" 
      : "created_by = ? AND org_id IS NULL";
    const scopeParams = orgId ? [orgId] : [userId];

    // Fetch existing items to avoid duplicates
    const { rows: existingItems } = await db.execute({
      sql: `SELECT name FROM shopping_items WHERE ${scopeClause}`,
      args: scopeParams,
    });

    const existingNames = new Set(
      existingItems.map((row) => (row.name as string).toLowerCase())
    );

    const addedIds: number[] = [];

    for (const item of items) {
      const normalizedName = item.name.toLowerCase();
      
      // Skip if item already exists (fuzzy match: contains)
      const alreadyExists = [...existingNames].some(
        (existing) => existing.includes(normalizedName) || normalizedName.includes(existing)
      );

      if (!alreadyExists) {
        console.log(`ShoppingService: Adding new item "${item.name}"`);
        
        const result = await db.execute({
          sql: `INSERT INTO shopping_items 
                (name, price, quantity, type, priority, is_checked, checked_by, checked_at, created_by, org_id) 
                VALUES (?, ?, 1, 'food', 3, 1, ?, datetime('now'), ?, ?)`,
          args: [item.name, item.price, userId, userId, orgId || null],
        });

        if (result.lastInsertRowid) {
          addedIds.push(Number(result.lastInsertRowid));
        }
        
        // Add to set to prevent duplicates within same receipt
        existingNames.add(normalizedName);
      }
    }

    console.log(`ShoppingService: Added ${addedIds.length} items from receipt`);
    return { addedCount: addedIds.length, addedIds };
  }

  /**
   * Fuzzy matches receipt items against active shopping list items
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


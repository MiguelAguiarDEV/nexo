/**
 * Purchase Pipeline Service
 * 
 * Functional programming approach: chains modular services together
 * to process a receipt: scan → add to shopping → mark as bought → add to finance
 */

import type { ReceiptData, ReceiptItem } from "@/lib/services/scan";
import { ShoppingService, type MatchResult, type AddToShoppingResult } from "@/lib/services/shopping";
import { FinanceService, type CreateExpenseResult } from "@/lib/services/finance";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PipelineParams {
  receipt: ReceiptData;
  userId: string;
  orgId: string | null;
}

export interface PipelineResult {
  addedToShopping: number;
  markedAsBought: number;
  expenseId: number;
}

// ============================================================================
// Pipeline Functions
// ============================================================================

/**
 * Main pipeline function that orchestrates the full purchase flow.
 * 
 * Flow:
 * 1. Add items from receipt to shopping list (if not already present)
 * 2. Mark matching items as bought in shopping list
 * 3. Create expense record in finance
 * 
 * @param params - Pipeline parameters containing receipt data and user context
 * @returns PipelineResult with counts and IDs
 */
export async function processPurchase(params: PipelineParams): Promise<PipelineResult> {
  const { receipt, userId, orgId } = params;

  console.log("Pipeline: Starting purchase processing...");

  // Step 1: Add items to shopping list (items not already present)
  const addResult = await ShoppingService.addItemsFromReceipt({
    items: receipt.items,
    userId,
    orgId,
  });
  console.log(`Pipeline: Added ${addResult.addedCount} new items to shopping list`);

  // Step 2: Mark items as bought (fuzzy matching against shopping list)
  const matchResult = await ShoppingService.checkOffItemsFromReceipt(
    receipt.items,
    userId,
    orgId
  );
  console.log(`Pipeline: Marked ${matchResult.matchedItemsCount} items as bought`);

  // Step 3: Create expense record
  const expenseResult = await FinanceService.createExpenseFromReceipt({
    receipt,
    userId,
    orgId,
  });
  console.log(`Pipeline: Created expense ID ${expenseResult.expenseId}`);

  console.log("Pipeline: Purchase processing complete!");

  return {
    addedToShopping: addResult.addedCount,
    markedAsBought: matchResult.matchedItemsCount,
    expenseId: expenseResult.expenseId,
  };
}

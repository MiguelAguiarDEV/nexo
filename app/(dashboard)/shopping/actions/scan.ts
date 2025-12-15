"use server";

import { getSafeAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ScanService, type ReceiptData } from "@/lib/services/scan";
import { processPurchase } from "@/lib/services/pipeline";

// Export type for client usage
export type { ReceiptData };

export async function scanReceipt(formData: FormData) {
  console.log("SERVER: scanReceipt action started (Service Layer)");
  
  try {
    const { userId } = await getSafeAuth(); // Ensure auth
    const file = formData.get("image") as File;
    
    if (!file) {
      throw new Error("No image provided");
    }

    // Use ScanService
    const data = await ScanService.analyzeReceipt(file);

    return { success: true, data };
  } catch (error) {
    console.error("SERVER: Error scanning receipt:", error);
    return { success: false, error: "Failed to process receipt image: " + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Confirms scan results and triggers the full purchase pipeline:
 * 1. Add items to shopping list
 * 2. Mark matching items as bought
 * 3. Create expense in finance
 */
export async function confirmScanResults(data: ReceiptData) {
  const { userId, orgId } = await getSafeAuth();
  console.log("Confirming scan results for User:", userId, "Org:", orgId);

  try {
    // Use the pipeline to process the full purchase flow
    const result = await processPurchase({
      receipt: data,
      userId,
      orgId,
    });

    revalidatePath("/shopping");
    revalidatePath("/finance");

    return { 
      success: true,
      addedToShopping: result.addedToShopping,
      markedAsBought: result.markedAsBought,
      expenseId: result.expenseId,
    };

  } catch (error) {
    console.error("Error confirming scan:", error);
    return { success: false, error: "Failed to save data: " + (error instanceof Error ? error.message : String(error)) };
  }
}


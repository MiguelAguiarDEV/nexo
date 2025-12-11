"use server";

import { getSafeAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ScanService, type ReceiptData } from "@/lib/services/scan";
import { ShoppingService } from "@/lib/services/shopping";
import { FinanceService } from "@/lib/services/finance";

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

export async function confirmScanResults(data: ReceiptData) {
  const { userId, orgId } = await getSafeAuth();
  console.log("Confirming scan results for User:", userId, "Org:", orgId);

  try {
    // 1. Check off items in Shopping List
    const { matchedItemsCount } = await ShoppingService.checkOffItemsFromReceipt(
      data.items, 
      userId, 
      orgId
    );
    console.log(`Matched and checked off ${matchedItemsCount} items`);

    // 2. Create Expense in Finance
    // Note: This service automatically handles user sync if needed
    await FinanceService.createExpenseFromReceipt(data, userId, orgId);

    revalidatePath("/shopping");
    // revalidatePath("/finance"); 

    return { 
      success: true, 
      matchedItemsCount 
    };

  } catch (error) {
    console.error("Error confirming scan:", error);
    return { success: false, error: "Failed to save data: " + (error instanceof Error ? error.message : String(error)) };
  }
}

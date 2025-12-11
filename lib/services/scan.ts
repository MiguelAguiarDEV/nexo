import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Initialize OpenAI provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Schema for the receipt data
const receiptSchema = z.object({
  store: z.string().describe("Name of the store or merchant"),
  date: z.string().describe("Date of purchase in YYYY-MM-DD format"),
  total: z.number().describe("Total amount paid"),
  items: z.array(
    z.object({
      name: z.string().describe("Name of the product"),
      price: z.number().describe("Price of the product"),
    })
  ).describe("List of items purchased"),
});

export type ReceiptData = z.infer<typeof receiptSchema>;
export type ReceiptItem = ReceiptData["items"][number];

export class ScanService {
  /**
   * Analyzes an image of a receipt using Google Gemini AI
   */
  static async analyzeReceipt(file: File): Promise<ReceiptData> {
    console.log(`ScanService: Analyzing file ${file.name} (${file.size} bytes)`);
    
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    try {
      const { object: data } = await generateObject({
        model: google("gemini-2.0-flash-lite-preview-02-05"),
        schema: receiptSchema,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this receipt image." },
              { type: "image", image: `data:${mimeType};base64,${base64Image}` },
            ],
          },
        ],
      });

      console.log("ScanService: Analysis successful", data);
      return data;
    } catch (error) {
      console.error("ScanService: Error analyzing receipt:", error);
      throw new Error("Failed to analyze receipt image: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}

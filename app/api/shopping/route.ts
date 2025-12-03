import {
  apiError,
  authenticateApiRequest,
  corsHeaders,
  handleCors,
} from "@/lib/api/auth";
import {
  DEFAULT_CURRENCY,
  DEFAULT_ITEM_TYPE,
  DEFAULT_PRIORITY,
} from "@/lib/constants/shopping";
import { db } from "@/lib/db";
import type { ItemType, Priority, ShoppingItem } from "@/types/db";
import { NextResponse } from "next/server";

// Helper to map DB row to ShoppingItem
function rowToShoppingItem(row: Record<string, unknown>): ShoppingItem {
  return {
    id: row.id as number,
    name: row.name as string,
    quantity: row.quantity as number,
    unit: row.unit as string | null,
    type: (row.type as ItemType) || DEFAULT_ITEM_TYPE,
    category: row.category as string | null,
    priority: (row.priority as Priority) || DEFAULT_PRIORITY,
    price: row.price as number | null,
    currency: (row.currency as string) || DEFAULT_CURRENCY,
    url: row.url as string | null,
    notes: row.notes as string | null,
    is_checked: Boolean(row.is_checked),
    checked_by: row.checked_by as string | null,
    checked_at: row.checked_at as string | null,
    created_by: row.created_by as string,
    org_id: row.org_id as string | null,
    created_at: row.created_at as string,
  };
}

/**
 * GET /api/shopping
 * List all shopping items
 * Query params: type, checked, limit
 */
export async function GET(request: Request) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handleCors();
  }

  // Authenticate
  const auth = await authenticateApiRequest(request, "shopping:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const { searchParams } = new URL(request.url);

  // Build query
  let sql: string;
  const args: (string | number | null)[] = [];

  if (orgId) {
    sql = `SELECT * FROM shopping_items WHERE org_id = ?`;
    args.push(orgId);
  } else {
    sql = `SELECT * FROM shopping_items WHERE created_by = ? AND org_id IS NULL`;
    args.push(userId);
  }

  // Filter by type
  const typeFilter = searchParams.get("type") as ItemType | null;
  if (typeFilter) {
    sql += ` AND type = ?`;
    args.push(typeFilter);
  }

  // Filter by checked status
  const checkedFilter = searchParams.get("checked");
  if (checkedFilter === "true") {
    sql += ` AND is_checked = 1`;
  } else if (checkedFilter === "false") {
    sql += ` AND is_checked = 0`;
  }

  sql += ` ORDER BY is_checked ASC, priority ASC, created_at DESC`;

  // Limit
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  sql += ` LIMIT ?`;
  args.push(Math.min(limit, 500));

  const result = await db.execute({ sql, args });
  const items = result.rows.map((row) =>
    rowToShoppingItem(row as Record<string, unknown>)
  );

  return NextResponse.json(
    { success: true, data: items, count: items.length },
    { headers: corsHeaders }
  );
}

/**
 * POST /api/shopping
 * Create a new shopping item
 */
export async function POST(request: Request) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handleCors();
  }

  // Authenticate
  const auth = await authenticateApiRequest(request, "shopping:write");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  // Validate required fields
  const name = body.name as string;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return apiError("name is required", 400);
  }

  // Extract optional fields with defaults
  const quantity = (body.quantity as number) || 1;
  const unit = (body.unit as string) || null;
  const type = (body.type as ItemType) || DEFAULT_ITEM_TYPE;
  const category = (body.category as string) || null;
  const priority = (body.priority as Priority) || DEFAULT_PRIORITY;
  const price = body.price !== undefined ? (body.price as number) : null;
  const currency = (body.currency as string) || DEFAULT_CURRENCY;
  const url = (body.url as string) || null;
  const notes = (body.notes as string) || null;

  // Validate URL if provided
  if (url) {
    try {
      new URL(url);
    } catch {
      return apiError("Invalid URL format", 400);
    }
  }

  // Insert
  const result = await db.execute({
    sql: `
      INSERT INTO shopping_items (name, quantity, unit, type, category, priority, price, currency, url, notes, created_by, org_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `,
    args: [
      name.trim(),
      quantity,
      unit,
      type,
      category,
      priority,
      price,
      currency,
      url,
      notes,
      userId,
      orgId,
    ],
  });

  const item = rowToShoppingItem(result.rows[0] as Record<string, unknown>);

  return NextResponse.json(
    { success: true, data: item },
    { status: 201, headers: corsHeaders }
  );
}

/**
 * OPTIONS /api/shopping
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}

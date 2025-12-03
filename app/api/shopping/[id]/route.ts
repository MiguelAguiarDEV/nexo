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

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/shopping/[id]
 * Get a single shopping item
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate
  const auth = await authenticateApiRequest(request, "shopping:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return apiError("Invalid item ID", 400);
  }

  // Get item and verify access
  const result = await db.execute({
    sql: `SELECT * FROM shopping_items WHERE id = ?`,
    args: [itemId],
  });

  if (result.rows.length === 0) {
    return apiError("Item not found", 404);
  }

  const item = rowToShoppingItem(result.rows[0] as Record<string, unknown>);

  // Verify access
  if (orgId) {
    if (item.org_id !== orgId) {
      return apiError("Access denied", 403);
    }
  } else {
    if (item.created_by !== userId || item.org_id !== null) {
      return apiError("Access denied", 403);
    }
  }

  return NextResponse.json(
    { success: true, data: item },
    { headers: corsHeaders }
  );
}

/**
 * PATCH /api/shopping/[id]
 * Update a shopping item
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate
  const auth = await authenticateApiRequest(request, "shopping:write");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return apiError("Invalid item ID", 400);
  }

  // Get item and verify access
  const existing = await db.execute({
    sql: `SELECT * FROM shopping_items WHERE id = ?`,
    args: [itemId],
  });

  if (existing.rows.length === 0) {
    return apiError("Item not found", 404);
  }

  const item = existing.rows[0];

  // Verify access
  if (orgId) {
    if (item.org_id !== orgId) {
      return apiError("Access denied", 403);
    }
  } else {
    if (item.created_by !== userId || item.org_id !== null) {
      return apiError("Access denied", 403);
    }
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  // Build dynamic update
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  const allowedFields = [
    "name",
    "quantity",
    "unit",
    "type",
    "category",
    "priority",
    "price",
    "currency",
    "url",
    "notes",
    "is_checked",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);

      if (field === "is_checked") {
        args.push(body[field] ? 1 : 0);

        // Also update checked_by and checked_at
        if (body[field]) {
          updates.push("checked_by = ?", "checked_at = datetime('now')");
          args.push(userId);
        } else {
          updates.push("checked_by = ?", "checked_at = ?");
          args.push(null, null);
        }
      } else {
        args.push(body[field] as string | number | null);
      }
    }
  }

  if (updates.length === 0) {
    return apiError("No fields to update", 400);
  }

  args.push(itemId);

  const result = await db.execute({
    sql: `UPDATE shopping_items SET ${updates.join(
      ", "
    )} WHERE id = ? RETURNING *`,
    args,
  });

  const updatedItem = rowToShoppingItem(
    result.rows[0] as Record<string, unknown>
  );

  return NextResponse.json(
    { success: true, data: updatedItem },
    { headers: corsHeaders }
  );
}

/**
 * DELETE /api/shopping/[id]
 * Delete a shopping item
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate
  const auth = await authenticateApiRequest(request, "shopping:write");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return apiError("Invalid item ID", 400);
  }

  // Get item and verify access
  const existing = await db.execute({
    sql: `SELECT * FROM shopping_items WHERE id = ?`,
    args: [itemId],
  });

  if (existing.rows.length === 0) {
    return apiError("Item not found", 404);
  }

  const item = existing.rows[0];

  // Verify access
  if (orgId) {
    if (item.org_id !== orgId) {
      return apiError("Access denied", 403);
    }
  } else {
    if (item.created_by !== userId || item.org_id !== null) {
      return apiError("Access denied", 403);
    }
  }

  // Delete
  await db.execute({
    sql: `DELETE FROM shopping_items WHERE id = ?`,
    args: [itemId],
  });

  return NextResponse.json(
    { success: true, message: "Item deleted" },
    { headers: corsHeaders }
  );
}

/**
 * OPTIONS /api/shopping/[id]
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}

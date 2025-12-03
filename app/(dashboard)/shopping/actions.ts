"use server";

import { getSafeAuth, getScope } from "@/lib/auth";
import {
  DEFAULT_CURRENCY,
  DEFAULT_ITEM_TYPE,
  DEFAULT_PRIORITY,
} from "@/lib/constants/shopping";
import { db } from "@/lib/db";
import type { ItemType, Priority, ShoppingItem } from "@/types/db";
import { revalidatePath } from "next/cache";

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

// Get all shopping items for the current user/org
export async function getShoppingItems(
  typeFilter?: ItemType
): Promise<ShoppingItem[]> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  let sql: string;
  const args: (string | number | null)[] = [];

  if (scope === "household" && orgId) {
    sql = `SELECT * FROM shopping_items WHERE org_id = ?`;
    args.push(orgId);
  } else {
    sql = `SELECT * FROM shopping_items WHERE created_by = ? AND org_id IS NULL`;
    args.push(userId);
  }

  // Add type filter if specified
  if (typeFilter) {
    sql += ` AND type = ?`;
    args.push(typeFilter);
  }

  sql += ` ORDER BY is_checked ASC, priority ASC, created_at DESC`;

  const result = await db.execute({ sql, args });
  return result.rows.map((row) =>
    rowToShoppingItem(row as Record<string, unknown>)
  );
}

// Legacy alias for backwards compatibility
export const getGroceries = getShoppingItems;

// Add a new shopping item
export async function addShoppingItem(
  formData: FormData
): Promise<{ success: boolean; error?: string; item?: ShoppingItem }> {
  const { userId, orgId } = await getSafeAuth();

  const name = formData.get("name") as string;
  const quantity = Number(formData.get("quantity")) || 1;
  const unit = (formData.get("unit") as string) || null;
  const type = (formData.get("type") as ItemType) || DEFAULT_ITEM_TYPE;
  const category = (formData.get("category") as string) || null;
  const priority =
    (Number(formData.get("priority")) as Priority) || DEFAULT_PRIORITY;
  const priceStr = formData.get("price") as string;
  const price = priceStr ? Number.parseFloat(priceStr) : null;
  const currency = (formData.get("currency") as string) || DEFAULT_CURRENCY;
  const url = (formData.get("url") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name || name.trim() === "") {
    return { success: false, error: "El nombre es requerido" };
  }

  // Validate URL if provided
  if (url && url.trim() !== "") {
    try {
      new URL(url);
    } catch {
      return { success: false, error: "La URL no es válida" };
    }
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO shopping_items (name, quantity, unit, type, category, priority, price, currency, url, notes, created_by, org_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
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
        orgId || null,
      ],
    });

    revalidatePath("/shopping");

    if (result.rows.length > 0) {
      return {
        success: true,
        item: rowToShoppingItem(result.rows[0] as Record<string, unknown>),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding shopping item:", error);
    return { success: false, error: "Error al añadir el producto" };
  }
}

// Legacy alias
export const addGrocery = addShoppingItem;

// Toggle shopping item checked status
export async function toggleShoppingItem(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  try {
    const existing = await db.execute({
      sql: `SELECT * FROM shopping_items WHERE id = ?`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return { success: false, error: "Producto no encontrado" };
    }

    const item = existing.rows[0];

    // Verify access
    if (scope === "household") {
      if (item.org_id !== orgId) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    } else {
      if (item.created_by !== userId || item.org_id !== null) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    }

    const isCurrentlyChecked = Boolean(item.is_checked);
    const newCheckedValue = isCurrentlyChecked ? 0 : 1;
    const checkedBy = isCurrentlyChecked ? null : userId;
    const checkedAt = isCurrentlyChecked ? null : new Date().toISOString();

    await db.execute({
      sql: `UPDATE shopping_items SET is_checked = ?, checked_by = ?, checked_at = ? WHERE id = ?`,
      args: [newCheckedValue, checkedBy, checkedAt, id],
    });

    revalidatePath("/shopping");
    return { success: true };
  } catch (error) {
    console.error("Error toggling shopping item:", error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

// Legacy alias
export const toggleGrocery = toggleShoppingItem;

// Delete a shopping item
export async function deleteShoppingItem(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  try {
    const existing = await db.execute({
      sql: `SELECT * FROM shopping_items WHERE id = ?`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return { success: false, error: "Producto no encontrado" };
    }

    const item = existing.rows[0];

    // Verify access
    if (scope === "household") {
      if (item.org_id !== orgId) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    } else {
      if (item.created_by !== userId || item.org_id !== null) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    }

    await db.execute({
      sql: `DELETE FROM shopping_items WHERE id = ?`,
      args: [id],
    });

    revalidatePath("/shopping");
    return { success: true };
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return { success: false, error: "Error al eliminar el producto" };
  }
}

// Legacy alias
export const deleteGrocery = deleteShoppingItem;

// Clear all checked items (optionally by type)
export async function clearCheckedItems(
  typeFilter?: ItemType
): Promise<{ success: boolean; error?: string; count?: number }> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  try {
    let sql: string;
    const args: (string | number | null)[] = [];

    if (scope === "household" && orgId) {
      sql = `DELETE FROM shopping_items WHERE org_id = ? AND is_checked = 1`;
      args.push(orgId);
    } else {
      sql = `DELETE FROM shopping_items WHERE created_by = ? AND org_id IS NULL AND is_checked = 1`;
      args.push(userId);
    }

    if (typeFilter) {
      sql += ` AND type = ?`;
      args.push(typeFilter);
    }

    const result = await db.execute({ sql, args });

    revalidatePath("/shopping");
    return { success: true, count: result.rowsAffected };
  } catch (error) {
    console.error("Error clearing checked items:", error);
    return { success: false, error: "Error al limpiar productos completados" };
  }
}

// Legacy alias
export const clearCheckedGroceries = clearCheckedItems;

// Update shopping item quantity
export async function updateShoppingItemQuantity(
  id: number,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  if (quantity < 1) {
    return { success: false, error: "La cantidad debe ser al menos 1" };
  }

  try {
    const existing = await db.execute({
      sql: `SELECT * FROM shopping_items WHERE id = ?`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return { success: false, error: "Producto no encontrado" };
    }

    const item = existing.rows[0];

    // Verify access
    if (scope === "household") {
      if (item.org_id !== orgId) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    } else {
      if (item.created_by !== userId || item.org_id !== null) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    }

    await db.execute({
      sql: `UPDATE shopping_items SET quantity = ? WHERE id = ?`,
      args: [quantity, id],
    });

    revalidatePath("/shopping");
    return { success: true };
  } catch (error) {
    console.error("Error updating quantity:", error);
    return { success: false, error: "Error al actualizar la cantidad" };
  }
}

// Legacy alias
export const updateGroceryQuantity = updateShoppingItemQuantity;

// Update shopping item (general update)
export async function updateShoppingItem(
  id: number,
  data: Partial<{
    name: string;
    quantity: number;
    unit: string | null;
    type: ItemType;
    category: string | null;
    priority: Priority;
    price: number | null;
    currency: string;
    url: string | null;
    notes: string | null;
  }>
): Promise<{ success: boolean; error?: string }> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  try {
    const existing = await db.execute({
      sql: `SELECT * FROM shopping_items WHERE id = ?`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return { success: false, error: "Producto no encontrado" };
    }

    const item = existing.rows[0];

    // Verify access
    if (scope === "household") {
      if (item.org_id !== orgId) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    } else {
      if (item.created_by !== userId || item.org_id !== null) {
        return { success: false, error: "No tienes acceso a este producto" };
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      args.push(data.name);
    }
    if (data.quantity !== undefined) {
      updates.push("quantity = ?");
      args.push(data.quantity);
    }
    if (data.unit !== undefined) {
      updates.push("unit = ?");
      args.push(data.unit);
    }
    if (data.type !== undefined) {
      updates.push("type = ?");
      args.push(data.type);
    }
    if (data.category !== undefined) {
      updates.push("category = ?");
      args.push(data.category);
    }
    if (data.priority !== undefined) {
      updates.push("priority = ?");
      args.push(data.priority);
    }
    if (data.price !== undefined) {
      updates.push("price = ?");
      args.push(data.price);
    }
    if (data.currency !== undefined) {
      updates.push("currency = ?");
      args.push(data.currency);
    }
    if (data.url !== undefined) {
      updates.push("url = ?");
      args.push(data.url);
    }
    if (data.notes !== undefined) {
      updates.push("notes = ?");
      args.push(data.notes);
    }

    if (updates.length === 0) {
      return { success: true }; // Nothing to update
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE shopping_items SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    revalidatePath("/shopping");
    return { success: true };
  } catch (error) {
    console.error("Error updating shopping item:", error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

// Get item counts by type
export async function getItemCountsByType(): Promise<
  Record<ItemType | "all", number>
> {
  const { userId, orgId } = await getSafeAuth();
  const scope = getScope(orgId);

  let sql: string;
  const args: (string | null)[] = [];

  if (scope === "household" && orgId) {
    sql = `SELECT type, COUNT(*) as count FROM shopping_items WHERE org_id = ? AND is_checked = 0 GROUP BY type`;
    args.push(orgId);
  } else {
    sql = `SELECT type, COUNT(*) as count FROM shopping_items WHERE created_by = ? AND org_id IS NULL AND is_checked = 0 GROUP BY type`;
    args.push(userId);
  }

  const result = await db.execute({ sql, args });

  const counts: Record<string, number> = { all: 0 };

  for (const row of result.rows) {
    const type = row.type as string;
    const count = row.count as number;
    counts[type] = count;
    counts.all += count;
  }

  return counts as Record<ItemType | "all", number>;
}

"use server";

import { DEFAULT_EVENT_COLOR } from "@/lib/constants/calendar";
import { db } from "@/lib/db";
import type { Event } from "@/types/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Helper to map DB row to Event
function rowToEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string | null,
    location: row.location as string | null,
    start_date: row.start_date as string,
    end_date: row.end_date as string | null,
    is_all_day: Boolean(row.is_all_day),
    color: (row.color as string) || DEFAULT_EVENT_COLOR,
    created_by: row.created_by as string,
    org_id: row.org_id as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// Columns to select (avoid SELECT *)
const EVENT_COLUMNS = `id, title, description, location, start_date, end_date, is_all_day, color, created_by, org_id, created_at, updated_at`;

// Get all events for the user/org, optionally filtered by date range
export async function getEvents(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Event[]> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  let sql: string;
  let args: (string | null)[];

  if (orgId) {
    // Household mode - get org events
    if (params?.startDate && params?.endDate) {
      sql = `SELECT ${EVENT_COLUMNS} FROM events WHERE org_id = ? AND start_date >= ? AND start_date <= ? ORDER BY start_date ASC`;
      args = [orgId, params.startDate, params.endDate];
    } else {
      sql = `SELECT ${EVENT_COLUMNS} FROM events WHERE org_id = ? ORDER BY start_date ASC`;
      args = [orgId];
    }
  } else {
    // Personal mode - get user's personal events
    if (params?.startDate && params?.endDate) {
      sql = `SELECT ${EVENT_COLUMNS} FROM events WHERE created_by = ? AND org_id IS NULL AND start_date >= ? AND start_date <= ? ORDER BY start_date ASC`;
      args = [userId, params.startDate, params.endDate];
    } else {
      sql = `SELECT ${EVENT_COLUMNS} FROM events WHERE created_by = ? AND org_id IS NULL ORDER BY start_date ASC`;
      args = [userId];
    }
  }

  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToEvent(row as Record<string, unknown>));
}

// Get events for a specific month
export async function getEventsForMonth(
  year: number,
  month: number
): Promise<Event[]> {
  // Get first day of month and first day of next month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  let sql: string;
  let args: (string | null)[];

  if (orgId) {
    sql = `SELECT ${EVENT_COLUMNS} FROM events WHERE org_id = ? AND start_date >= ? AND start_date < ? ORDER BY start_date ASC`;
    args = [orgId, startDate, endDate];
  } else {
    sql = `SELECT ${EVENT_COLUMNS} FROM events WHERE created_by = ? AND org_id IS NULL AND start_date >= ? AND start_date < ? ORDER BY start_date ASC`;
    args = [userId, startDate, endDate];
  }

  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToEvent(row as Record<string, unknown>));
}

// Add a new event
export async function addEvent(data: {
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_all_day?: boolean;
  color?: string;
}): Promise<Event> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  if (!data.title?.trim()) {
    throw new Error("Title is required");
  }

  if (!data.start_date) {
    throw new Error("Start date is required");
  }

  const result = await db.execute({
    sql: `
      INSERT INTO events (title, description, location, start_date, end_date, is_all_day, color, created_by, org_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `,
    args: [
      data.title.trim(),
      data.description?.trim() || null,
      data.location?.trim() || null,
      data.start_date,
      data.end_date || null,
      data.is_all_day ? 1 : 0,
      data.color || DEFAULT_EVENT_COLOR,
      userId,
      orgId || null,
    ],
  });

  revalidatePath("/calendar");
  return rowToEvent(result.rows[0] as Record<string, unknown>);
}

// Update an event
export async function updateEvent(
  id: number,
  data: {
    title?: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_all_day?: boolean;
    color?: string;
  }
): Promise<Event> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [id],
  });

  if (existing.rows.length === 0) {
    throw new Error("Event not found");
  }

  const event = existing.rows[0];

  // Check access
  if (orgId) {
    if (event.org_id !== orgId) {
      throw new Error("Access denied");
    }
  } else {
    if (event.created_by !== userId || event.org_id !== null) {
      throw new Error("Access denied");
    }
  }

  // Build dynamic update
  const updates: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    args.push(data.title.trim());
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    args.push(data.description?.trim() || null);
  }
  if (data.location !== undefined) {
    updates.push("location = ?");
    args.push(data.location?.trim() || null);
  }
  if (data.start_date !== undefined) {
    updates.push("start_date = ?");
    args.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    updates.push("end_date = ?");
    args.push(data.end_date || null);
  }
  if (data.is_all_day !== undefined) {
    updates.push("is_all_day = ?");
    args.push(data.is_all_day ? 1 : 0);
  }
  if (data.color !== undefined) {
    updates.push("color = ?");
    args.push(data.color);
  }

  args.push(id);

  const result = await db.execute({
    sql: `UPDATE events SET ${updates.join(", ")} WHERE id = ? RETURNING *`,
    args,
  });

  revalidatePath("/calendar");
  return rowToEvent(result.rows[0] as Record<string, unknown>);
}

// Delete an event
export async function deleteEvent(id: number): Promise<void> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify ownership
  const existing = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [id],
  });

  if (existing.rows.length === 0) {
    throw new Error("Event not found");
  }

  const event = existing.rows[0];

  // Check access
  if (orgId) {
    if (event.org_id !== orgId) {
      throw new Error("Access denied");
    }
  } else {
    if (event.created_by !== userId || event.org_id !== null) {
      throw new Error("Access denied");
    }
  }

  await db.execute({
    sql: `DELETE FROM events WHERE id = ?`,
    args: [id],
  });

  revalidatePath("/calendar");
}

// Get a single event by ID
export async function getEvent(id: number): Promise<Event | null> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const result = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const event = rowToEvent(result.rows[0] as Record<string, unknown>);

  // Check access
  if (orgId) {
    if (event.org_id !== orgId) {
      return null;
    }
  } else {
    if (event.created_by !== userId || event.org_id !== null) {
      return null;
    }
  }

  return event;
}

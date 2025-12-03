import {
  apiError,
  authenticateApiRequest,
  corsHeaders,
  handleCors,
} from "@/lib/api/auth";
import { DEFAULT_EVENT_COLOR } from "@/lib/constants/calendar";
import { db } from "@/lib/db";
import type { Event } from "@/types/db";
import { NextResponse } from "next/server";

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

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/events/[id]
 * Get a single event
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const auth = await authenticateApiRequest(request, "events:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const eventId = Number.parseInt(id, 10);

  if (Number.isNaN(eventId)) {
    return apiError("Invalid event ID", 400);
  }

  const result = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [eventId],
  });

  if (result.rows.length === 0) {
    return apiError("Event not found", 404);
  }

  const event = rowToEvent(result.rows[0] as Record<string, unknown>);

  // Verify access
  if (orgId) {
    if (event.org_id !== orgId) {
      return apiError("Access denied", 403);
    }
  } else {
    if (event.created_by !== userId || event.org_id !== null) {
      return apiError("Access denied", 403);
    }
  }

  return NextResponse.json(
    { success: true, data: event },
    { headers: corsHeaders }
  );
}

/**
 * PATCH /api/events/[id]
 * Update an event
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const auth = await authenticateApiRequest(request, "events:write");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const eventId = Number.parseInt(id, 10);

  if (Number.isNaN(eventId)) {
    return apiError("Invalid event ID", 400);
  }

  // Get existing event
  const existing = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [eventId],
  });

  if (existing.rows.length === 0) {
    return apiError("Event not found", 404);
  }

  const event = existing.rows[0];

  // Verify access
  if (orgId) {
    if (event.org_id !== orgId) {
      return apiError("Access denied", 403);
    }
  } else {
    if (event.created_by !== userId || event.org_id !== null) {
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
  const updates: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];

  const allowedFields = [
    "title",
    "description",
    "location",
    "start_date",
    "end_date",
    "is_all_day",
    "color",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);

      if (field === "is_all_day") {
        args.push(body[field] ? 1 : 0);
      } else if (field === "title" && typeof body[field] === "string") {
        args.push((body[field] as string).trim());
      } else {
        args.push(body[field] as string | number | null);
      }
    }
  }

  if (updates.length === 1) {
    // Only updated_at, no real changes
    return apiError("No fields to update", 400);
  }

  args.push(eventId);

  const result = await db.execute({
    sql: `UPDATE events SET ${updates.join(", ")} WHERE id = ? RETURNING *`,
    args,
  });

  const updatedEvent = rowToEvent(result.rows[0] as Record<string, unknown>);

  return NextResponse.json(
    { success: true, data: updatedEvent },
    { headers: corsHeaders }
  );
}

/**
 * DELETE /api/events/[id]
 * Delete an event
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const auth = await authenticateApiRequest(request, "events:write");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const eventId = Number.parseInt(id, 10);

  if (Number.isNaN(eventId)) {
    return apiError("Invalid event ID", 400);
  }

  // Get existing event
  const existing = await db.execute({
    sql: `SELECT * FROM events WHERE id = ?`,
    args: [eventId],
  });

  if (existing.rows.length === 0) {
    return apiError("Event not found", 404);
  }

  const event = existing.rows[0];

  // Verify access
  if (orgId) {
    if (event.org_id !== orgId) {
      return apiError("Access denied", 403);
    }
  } else {
    if (event.created_by !== userId || event.org_id !== null) {
      return apiError("Access denied", 403);
    }
  }

  await db.execute({
    sql: `DELETE FROM events WHERE id = ?`,
    args: [eventId],
  });

  return NextResponse.json(
    { success: true, message: "Event deleted" },
    { headers: corsHeaders }
  );
}

/**
 * OPTIONS /api/events/[id]
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}

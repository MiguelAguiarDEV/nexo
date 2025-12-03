import {
  apiError,
  apiSuccess,
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

/**
 * GET /api/events
 * Get all events, optionally filtered by date range
 * Query params: start_date, end_date
 */
export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request, "events:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  let sql: string;
  let args: (string | null)[];

  if (orgId) {
    if (startDate && endDate) {
      sql = `SELECT * FROM events WHERE org_id = ? AND start_date >= ? AND start_date <= ? ORDER BY start_date ASC`;
      args = [orgId, startDate, endDate];
    } else {
      sql = `SELECT * FROM events WHERE org_id = ? ORDER BY start_date ASC`;
      args = [orgId];
    }
  } else {
    if (startDate && endDate) {
      sql = `SELECT * FROM events WHERE created_by = ? AND org_id IS NULL AND start_date >= ? AND start_date <= ? ORDER BY start_date ASC`;
      args = [userId, startDate, endDate];
    } else {
      sql = `SELECT * FROM events WHERE created_by = ? AND org_id IS NULL ORDER BY start_date ASC`;
      args = [userId];
    }
  }

  const result = await db.execute({ sql, args });
  const events = result.rows.map((row) =>
    rowToEvent(row as Record<string, unknown>)
  );

  return apiSuccess({ data: events, count: events.length });
}

/**
 * POST /api/events
 * Create a new event
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request, "events:write");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const {
    title,
    description,
    location,
    start_date,
    end_date,
    is_all_day,
    color,
  } = body as {
    title?: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_all_day?: boolean;
    color?: string;
  };

  if (!title?.trim()) {
    return apiError("Title is required", 400);
  }

  if (!start_date) {
    return apiError("Start date is required", 400);
  }

  const result = await db.execute({
    sql: `
      INSERT INTO events (title, description, location, start_date, end_date, is_all_day, color, created_by, org_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `,
    args: [
      title.trim(),
      description?.trim() || null,
      location?.trim() || null,
      start_date,
      end_date || null,
      is_all_day ? 1 : 0,
      color || DEFAULT_EVENT_COLOR,
      userId,
      orgId || null,
    ],
  });

  const event = rowToEvent(result.rows[0] as Record<string, unknown>);

  return NextResponse.json(
    { success: true, data: event },
    { status: 201, headers: corsHeaders }
  );
}

/**
 * OPTIONS /api/events
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}

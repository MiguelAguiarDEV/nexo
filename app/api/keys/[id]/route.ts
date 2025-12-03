import {
  apiError,
  authenticateApiRequest,
  corsHeaders,
  handleCors,
} from "@/lib/api/auth";
import { revokeApiKey } from "@/lib/api/keys";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * DELETE /api/keys/[id]
 * Revoke an API key
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate
  const auth = await authenticateApiRequest(request, "shopping:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId } = auth;
  const keyId = parseInt(id, 10);

  if (isNaN(keyId)) {
    return apiError("Invalid key ID", 400);
  }

  // Verify the key belongs to this user
  const existing = await db.execute({
    sql: `SELECT * FROM api_keys WHERE id = ? AND user_id = ?`,
    args: [keyId, userId],
  });

  if (existing.rows.length === 0) {
    return apiError("API key not found", 404);
  }

  // Revoke
  const success = await revokeApiKey(keyId, userId);

  if (!success) {
    return apiError("Failed to revoke API key", 500);
  }

  return NextResponse.json(
    { success: true, message: "API key revoked" },
    { headers: corsHeaders }
  );
}

/**
 * OPTIONS /api/keys/[id]
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}

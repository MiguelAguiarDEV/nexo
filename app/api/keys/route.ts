import {
  apiError,
  authenticateApiRequest,
  corsHeaders,
  handleCors,
} from "@/lib/api/auth";
import { createApiKey, listApiKeys } from "@/lib/api/keys";
import type { ApiScope } from "@/types/db";
import { NextResponse } from "next/server";

/**
 * GET /api/keys
 * List all API keys for the authenticated user
 */
export async function GET(request: Request) {
  // Authenticate (needs any valid key with any scope)
  const auth = await authenticateApiRequest(request, "shopping:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId } = auth;

  const keys = await listApiKeys(userId);

  // Don't return the full hash, just metadata
  const safeKeys = keys.map((key) => ({
    id: key.id,
    name: key.name,
    key_prefix: key.key_prefix,
    scopes: key.scopes,
    created_at: key.created_at,
    last_used_at: key.last_used_at,
    expires_at: key.expires_at,
  }));

  return NextResponse.json(
    { success: true, data: safeKeys },
    { headers: corsHeaders }
  );
}

/**
 * POST /api/keys
 * Generate a new API key
 * Body: { name: string, scopes: ApiScope[], expires_in_days?: number }
 */
export async function POST(request: Request) {
  // For creating keys, we need to authenticate via Clerk session
  // This endpoint should only be accessible from the web UI
  // So we check for a valid existing API key OR we could check Clerk session

  // For now, require an existing API key with any scope to create new keys
  // In production, you might want this to only work from the web UI with Clerk auth
  const auth = await authenticateApiRequest(request, "shopping:read");
  if (!auth.success) {
    return apiError(auth.error, auth.status);
  }

  const { userId, orgId } = auth;

  let body: { name?: string; scopes?: ApiScope[]; expires_in_days?: number };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { name, scopes, expires_in_days } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return apiError("Name is required", 400);
  }

  if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
    return apiError("At least one scope is required", 400);
  }

  // Validate scopes
  const validScopes: ApiScope[] = [
    "shopping:read",
    "shopping:write",
    "events:read",
    "events:write",
    "expenses:read",
    "expenses:write",
    "chores:read",
    "chores:write",
  ];

  for (const scope of scopes) {
    if (!validScopes.includes(scope)) {
      return apiError(`Invalid scope: ${scope}`, 400);
    }
  }

  // Calculate expiration
  let expiresAt: Date | undefined;
  if (
    expires_in_days &&
    typeof expires_in_days === "number" &&
    expires_in_days > 0
  ) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);
  }

  const result = await createApiKey({
    userId,
    orgId: orgId || undefined,
    name: name.trim(),
    scopes: scopes as ApiScope[],
    expiresAt: expiresAt?.toISOString() || null,
  });

  // Return the full key only this once - it won't be retrievable again
  return NextResponse.json(
    {
      success: true,
      data: {
        id: result.apiKey.id,
        key: result.plainKey, // Only shown once!
        name: name.trim(),
        scopes,
        expires_at: expiresAt?.toISOString() || null,
      },
      warning: "Save this API key now. It will not be shown again.",
    },
    { status: 201, headers: corsHeaders }
  );
}

/**
 * OPTIONS /api/keys
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}

import { createApiKey } from "@/lib/api/keys";
import type { ApiScope } from "@/types/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * POST /api/keys/generate
 * Generate a new API key using Clerk session auth
 * This is the only way to create your first API key
 * Body: { name: string, scopes: ApiScope[], expires_in_days?: number }
 */
export async function POST(request: Request) {
  // Authenticate via Clerk session
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - please sign in" },
      { status: 401 }
    );
  }

  let body: { name?: string; scopes?: ApiScope[]; expires_in_days?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, scopes, expires_in_days } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Name is required" },
      { status: 400 }
    );
  }

  if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json(
      { success: false, error: "At least one scope is required" },
      { status: 400 }
    );
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
      return NextResponse.json(
        { success: false, error: `Invalid scope: ${scope}` },
        { status: 400 }
      );
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

  try {
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate API key:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}

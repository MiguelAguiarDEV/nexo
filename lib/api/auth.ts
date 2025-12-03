import { hasScope, validateApiKey } from "@/lib/api/keys";
import type { ApiKey, ApiScope } from "@/types/db";
import { NextResponse } from "next/server";

export interface ApiAuthResult {
  success: true;
  apiKey: ApiKey;
  userId: string;
  orgId: string | null;
}

export interface ApiAuthError {
  success: false;
  error: string;
  status: number;
}

export type ApiAuth = ApiAuthResult | ApiAuthError;

/**
 * Authenticate an API request using the X-API-Key header
 */
export async function authenticateApiRequest(
  request: Request,
  requiredScope?: ApiScope
): Promise<ApiAuth> {
  // Get API key from header
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    return {
      success: false,
      error: "Missing X-API-Key header",
      status: 401,
    };
  }

  // Validate the key
  const validation = await validateApiKey(apiKey);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      status: 401,
    };
  }

  // Check scope if required
  if (requiredScope && !hasScope(validation.apiKey, requiredScope)) {
    return {
      success: false,
      error: `Missing required scope: ${requiredScope}`,
      status: 403,
    };
  }

  return {
    success: true,
    apiKey: validation.apiKey,
    userId: validation.apiKey.user_id,
    orgId: validation.apiKey.org_id,
  };
}

/**
 * Helper to create error responses
 */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Helper to create success responses
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * CORS headers for API routes
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

/**
 * Handle CORS preflight requests
 */
export function handleCors(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

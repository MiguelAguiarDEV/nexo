import { db } from "@/lib/db";
import type { ApiKey, ApiScope } from "@/types/db";
import { createHash, randomBytes } from "crypto";

// Prefix for all API keys
const KEY_PREFIX = "nxk_";

// Generate a secure random API key
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const randomPart = randomBytes(32).toString("base64url");
  const key = `${KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 12); // "nxk_" + 8 chars

  return { key, hash, prefix };
}

// Hash an API key for storage
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Create a new API key for a user
export async function createApiKey(params: {
  userId: string;
  orgId?: string | null;
  name: string;
  scopes?: ApiScope[];
  expiresAt?: string | null;
}): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const { key, hash, prefix } = generateApiKey();
  const scopes = params.scopes || ["*"];

  const result = await db.execute({
    sql: `
      INSERT INTO api_keys (key_hash, key_prefix, user_id, org_id, name, scopes, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `,
    args: [
      hash,
      prefix,
      params.userId,
      params.orgId || null,
      params.name,
      JSON.stringify(scopes),
      params.expiresAt || null,
    ],
  });

  const row = result.rows[0];
  const apiKey = rowToApiKey(row as Record<string, unknown>);

  return { apiKey, plainKey: key };
}

// Validate an API key and return the associated data
export async function validateApiKey(
  key: string
): Promise<{ valid: false; error: string } | { valid: true; apiKey: ApiKey }> {
  if (!key || !key.startsWith(KEY_PREFIX)) {
    return { valid: false, error: "Invalid API key format" };
  }

  const hash = hashApiKey(key);

  const result = await db.execute({
    sql: `SELECT * FROM api_keys WHERE key_hash = ?`,
    args: [hash],
  });

  if (result.rows.length === 0) {
    return { valid: false, error: "API key not found" };
  }

  const apiKey = rowToApiKey(result.rows[0] as Record<string, unknown>);

  // Check if active
  if (!apiKey.is_active) {
    return { valid: false, error: "API key is disabled" };
  }

  // Check expiration
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Update last_used_at
  await db.execute({
    sql: `UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`,
    args: [apiKey.id],
  });

  return { valid: true, apiKey };
}

// Check if an API key has a specific scope
export function hasScope(apiKey: ApiKey, requiredScope: ApiScope): boolean {
  // Wildcard grants all permissions
  if (apiKey.scopes.includes("*")) {
    return true;
  }

  // Check exact match
  if (apiKey.scopes.includes(requiredScope)) {
    return true;
  }

  // Check if has write permission (implies read)
  const [resource, action] = requiredScope.split(":") as [string, string];
  if (
    action === "read" &&
    apiKey.scopes.includes(`${resource}:write` as ApiScope)
  ) {
    return true;
  }

  return false;
}

// List API keys for a user
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const result = await db.execute({
    sql: `SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });

  return result.rows.map((row) => rowToApiKey(row as Record<string, unknown>));
}

// Revoke (deactivate) an API key
export async function revokeApiKey(
  keyId: number,
  userId: string
): Promise<boolean> {
  const result = await db.execute({
    sql: `UPDATE api_keys SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    args: [keyId, userId],
  });

  return result.rowsAffected > 0;
}

// Delete an API key
export async function deleteApiKey(
  keyId: number,
  userId: string
): Promise<boolean> {
  const result = await db.execute({
    sql: `DELETE FROM api_keys WHERE id = ? AND user_id = ?`,
    args: [keyId, userId],
  });

  return result.rowsAffected > 0;
}

// Helper to convert DB row to ApiKey
function rowToApiKey(row: Record<string, unknown>): ApiKey {
  return {
    id: row.id as number,
    key_hash: row.key_hash as string,
    key_prefix: row.key_prefix as string,
    user_id: row.user_id as string,
    org_id: row.org_id as string | null,
    name: row.name as string,
    scopes: JSON.parse((row.scopes as string) || '["*"]') as string[],
    is_active: Boolean(row.is_active),
    last_used_at: row.last_used_at as string | null,
    expires_at: row.expires_at as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

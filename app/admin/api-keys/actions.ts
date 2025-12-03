"use server";

import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api/keys";
import type { ApiScope } from "@/types/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "miguel.santiesteban.aguiar@gmail.com";

async function checkAdminAccess() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (email !== ADMIN_EMAIL) {
    throw new Error("Access denied");
  }

  return user;
}

export async function getApiKeysAction() {
  const user = await checkAdminAccess();

  const keys = await listApiKeys(user.id);

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    key_prefix: key.key_prefix,
    scopes: key.scopes as ApiScope[],
    is_active: key.is_active,
    created_at: key.created_at,
    last_used_at: key.last_used_at,
    expires_at: key.expires_at,
  }));
}

export async function createApiKeyAction(formData: FormData) {
  const user = await checkAdminAccess();

  const name = formData.get("name") as string;
  const scopesRaw = formData.get("scopes") as string;
  const expiresInDays = formData.get("expires_in_days") as string;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const scopes = scopesRaw
    ? (scopesRaw.split(",").filter(Boolean) as ApiScope[])
    : (["shopping:read", "shopping:write"] as ApiScope[]);

  let expiresAt: string | null = null;
  if (expiresInDays && Number.parseInt(expiresInDays) > 0) {
    const date = new Date();
    date.setDate(date.getDate() + Number.parseInt(expiresInDays));
    expiresAt = date.toISOString();
  }

  try {
    const result = await createApiKey({
      userId: user.id,
      name: name.trim(),
      scopes,
      expiresAt,
    });

    revalidatePath("/admin/api-keys");

    return {
      success: true,
      key: result.plainKey,
      message: "API key created! Copy it now - it won't be shown again.",
    };
  } catch (error) {
    console.error("Failed to create API key:", error);
    return { success: false, error: "Failed to create API key" };
  }
}

export async function revokeApiKeyAction(keyId: number) {
  const user = await checkAdminAccess();

  try {
    const success = await revokeApiKey(keyId, user.id);

    if (!success) {
      return { success: false, error: "Failed to revoke API key" };
    }

    revalidatePath("/admin/api-keys");
    return { success: true };
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return { success: false, error: "Failed to revoke API key" };
  }
}

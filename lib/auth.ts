import { auth } from "@clerk/nextjs/server";

export interface AuthContext {
  userId: string;
  orgId: string | null;
}

/**
 * Get safe authentication context.
 * Throws an error if the user is not authenticated.
 */
export async function getSafeAuth(): Promise<AuthContext> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("No autorizado");
  }

  return {
    userId,
    orgId: orgId ?? null,
  };
}

/**
 * Get the current scope based on authentication context.
 * If orgId is present, we're in household mode, otherwise personal.
 */
export function getScope(orgId: string | null): "personal" | "household" {
  return orgId ? "household" : "personal";
}

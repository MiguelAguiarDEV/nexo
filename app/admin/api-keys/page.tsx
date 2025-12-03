import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getApiKeysAction } from "./actions";
import { ApiKeysClient } from "./api-keys-client";

const ADMIN_EMAIL = "miguel.santiesteban.aguiar@gmail.com";

export default async function ApiKeysPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const email = user.emailAddresses[0]?.emailAddress;

  if (email !== ADMIN_EMAIL) {
    redirect("/home");
  }

  const keys = await getApiKeysAction();

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground mt-1">
          Manage API keys for external access (MCP, n8n, etc.)
        </p>
      </div>

      <ApiKeysClient initialKeys={keys} />
    </div>
  );
}

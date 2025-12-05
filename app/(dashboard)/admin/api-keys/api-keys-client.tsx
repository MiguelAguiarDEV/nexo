"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiScope } from "@/types/db";
import { Copy, Key, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createApiKeyAction, revokeApiKeyAction } from "./actions";

interface ApiKeyInfo {
  id: number;
  name: string;
  key_prefix: string;
  scopes: ApiScope[];
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

interface Props {
  initialKeys: ApiKeyInfo[];
}

const AVAILABLE_SCOPES: { value: ApiScope; label: string }[] = [
  { value: "shopping:read", label: "Shopping (Read)" },
  { value: "shopping:write", label: "Shopping (Write)" },
  { value: "events:read", label: "Events (Read)" },
  { value: "events:write", label: "Events (Write)" },
  { value: "expenses:read", label: "Expenses (Read)" },
  { value: "expenses:write", label: "Expenses (Write)" },
  { value: "chores:read", label: "Chores (Read)" },
  { value: "chores:write", label: "Chores (Write)" },
];

export function ApiKeysClient({ initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>(initialKeys);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([
    "shopping:read",
    "shopping:write",
  ]);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: FormData) => {
    formData.set("scopes", selectedScopes.join(","));

    startTransition(async () => {
      const result = await createApiKeyAction(formData);

      if (result.success && result.key) {
        setNewKey(result.key);
        setShowCreateForm(false);
        // Refresh keys list
        window.location.reload();
      } else {
        alert(result.error || "Failed to create key");
      }
    });
  };

  const handleRevoke = async (keyId: number) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;

    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);

      if (result.success) {
        setKeys(keys.filter((k) => k.id !== keyId));
      } else {
        alert(result.error || "Failed to revoke key");
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleScope = (scope: ApiScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      {/* New Key Alert */}
      {newKey && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
              <Key className="h-5 w-5" />
              New API Key Created
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Copy this key now. It will not be shown again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-white dark:bg-black rounded border font-mono text-sm break-all">
                {newKey}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(newKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setNewKey(null)}
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., n8n Integration"
                  required
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="rounded"
                      />
                      <span className="text-sm">{scope.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="expires_in_days">
                  Expires in (days, 0 = never)
                </Label>
                <Input
                  id="expires_in_days"
                  name="expires_in_days"
                  type="number"
                  min="0"
                  defaultValue="0"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Key"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      )}

      {/* Keys List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your API Keys</h2>

        {keys.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No API keys yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card
              key={key.id}
              className={!key.is_active ? "opacity-50" : undefined}
            >
              <CardContent className="py-4 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{key.name}</span>
                      {!key.is_active && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded shrink-0">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {key.key_prefix}...
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created:{" "}
                      {new Date(key.created_at).toLocaleDateString("es-ES")}
                      {key.last_used_at && (
                        <>
                          {" "}
                          • Last used:{" "}
                          {new Date(key.last_used_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </>
                      )}
                      {key.expires_at && (
                        <>
                          {" "}
                          • Expires:{" "}
                          {new Date(key.expires_at).toLocaleDateString("es-ES")}
                        </>
                      )}
                    </p>
                  </div>

                  {key.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 self-end sm:self-start"
                      onClick={() => handleRevoke(key.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div>
            <h3 className="font-medium mb-2 text-sm sm:text-base">
              Authentication Header
            </h3>
            <code className="block p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm overflow-x-auto">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-sm sm:text-base">
              Example: Get Shopping List
            </h3>
            <code className="block p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto">
              {`curl -X GET "https://your-domain/api/shopping" \\
  -H "Authorization: Bearer nxk_your_key_here"`}
            </code>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-sm sm:text-base">
              Example: Add Shopping Item
            </h3>
            <code className="block p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm whitespace-pre-wrap overflow-x-auto">
              {`curl -X POST "https://your-domain/api/shopping" \\
  -H "Authorization: Bearer nxk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Milk", "type": "food", "priority": 2}'`}
            </code>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-sm sm:text-base">
              Available Endpoints
            </h3>
            <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
              <li>
                <code className="text-foreground">GET /api/shopping</code> -
                List all items
              </li>
              <li>
                <code className="text-foreground">POST /api/shopping</code> -
                Create new item
              </li>
              <li>
                <code className="text-foreground">GET /api/shopping/:id</code> -
                Get single item
              </li>
              <li>
                <code className="text-foreground">PATCH /api/shopping/:id</code>{" "}
                - Update item
              </li>
              <li>
                <code className="text-foreground">
                  DELETE /api/shopping/:id
                </code>{" "}
                - Delete item
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

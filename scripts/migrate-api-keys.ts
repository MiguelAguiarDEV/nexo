import { createClient } from "@libsql/client";

async function runMigration() {
  const db = createClient({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_TOKEN,
  });

  console.log("🚀 Running API keys migration...");

  // Run each statement separately
  const statements = [
    `CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      user_id TEXT NOT NULL,
      org_id TEXT,
      name TEXT NOT NULL,
      scopes TEXT DEFAULT '["*"]',
      is_active INTEGER DEFAULT 1,
      last_used_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active)`,
  ];

  for (const statement of statements) {
    try {
      await db.execute(statement);
      console.log("✅ Executed:", statement.substring(0, 60) + "...");
    } catch (error) {
      console.error("❌ Error executing:", statement.substring(0, 60));
      console.error(error);
    }
  }

  console.log("✅ Migration completed!");
  process.exit(0);
}

runMigration().catch(console.error);

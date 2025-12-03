// Script to run migration for shopping_items table
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN,
});

async function migrate() {
  console.log("🚀 Starting migration...\n");

  // Step 1: Create the new shopping_items table
  console.log("1. Creating shopping_items table...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit TEXT,
      type TEXT DEFAULT 'other' CHECK (type IN ('food', 'kitchen', 'bathroom', 'cleaning', 'clothing', 'electronics', 'home', 'other')),
      category TEXT,
      priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
      price REAL,
      currency TEXT DEFAULT 'EUR',
      url TEXT,
      notes TEXT,
      is_checked INTEGER DEFAULT 0,
      checked_by TEXT,
      checked_at TEXT,
      created_by TEXT NOT NULL,
      org_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("   ✅ Table created\n");

  // Step 2: Check if groceries table exists and migrate data
  console.log("2. Checking for existing groceries table...");
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='groceries'"
  );

  if (tables.rows.length > 0) {
    console.log("   Found groceries table, migrating data...");

    // Check if there's any data to migrate
    const count = await db.execute("SELECT COUNT(*) as count FROM groceries");
    const itemCount = count.rows[0].count as number;

    if (itemCount > 0) {
      await db.execute(`
        INSERT INTO shopping_items (id, name, quantity, unit, category, type, priority, is_checked, checked_by, checked_at, created_by, org_id, created_at)
        SELECT id, name, quantity, unit, category, 'food', 3, is_checked, checked_by, checked_at, created_by, org_id, created_at
        FROM groceries
      `);
      console.log(`   ✅ Migrated ${itemCount} items from groceries\n`);
    } else {
      console.log("   ℹ️  No data to migrate\n");
    }
  } else {
    console.log("   ℹ️  No groceries table found, skipping migration\n");
  }

  // Step 3: Create indexes
  console.log("3. Creating indexes...");
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_shopping_items_org ON shopping_items(org_id)"
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_shopping_items_checked ON shopping_items(is_checked)"
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_shopping_items_type ON shopping_items(type)"
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON shopping_items(priority)"
  );
  console.log("   ✅ Indexes created\n");

  // Step 4: Verify
  console.log("4. Verifying migration...");
  const newCount = await db.execute(
    "SELECT COUNT(*) as count FROM shopping_items"
  );
  console.log(
    `   ✅ shopping_items table has ${newCount.rows[0].count} items\n`
  );

  console.log("🎉 Migration completed successfully!");
}

migrate().catch(console.error);

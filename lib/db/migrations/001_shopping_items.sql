-- Migration: Expand groceries to shopping_items
-- This migration adds support for multiple item types, priority, price, and URLs

-- Step 1: Create the new shopping_items table
CREATE TABLE IF NOT EXISTS shopping_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  -- Item categorization
  type TEXT DEFAULT 'other' CHECK (type IN ('food', 'kitchen', 'bathroom', 'cleaning', 'clothing', 'electronics', 'home', 'other')),
  category TEXT, -- Subcategory within type (e.g., "fruits", "dairy" for food)
  -- Priority: 1 (urgent), 2 (high), 3 (normal), 4 (low)
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
  -- Optional price and link
  price REAL,
  currency TEXT DEFAULT 'EUR',
  url TEXT,
  notes TEXT,
  -- Status
  is_checked INTEGER DEFAULT 0,
  checked_by TEXT REFERENCES users(id),
  checked_at TEXT,
  -- Scope
  created_by TEXT NOT NULL REFERENCES users(id),
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Step 2: Migrate existing data from groceries (if it exists)
INSERT INTO shopping_items (id, name, quantity, unit, category, type, priority, is_checked, checked_by, checked_at, created_by, org_id, created_at)
SELECT id, name, quantity, unit, category, 'food', 3, is_checked, checked_by, checked_at, created_by, org_id, created_at
FROM groceries
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='groceries');

-- Step 3: Create indexes for the new table
CREATE INDEX IF NOT EXISTS idx_shopping_items_org ON shopping_items(org_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_checked ON shopping_items(is_checked);
CREATE INDEX IF NOT EXISTS idx_shopping_items_type ON shopping_items(type);
CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON shopping_items(priority);

-- Step 4: Drop the old groceries table (uncomment when ready)
-- DROP TABLE IF EXISTS groceries;

-- Step 5: Drop old indexes (uncomment when ready)
-- DROP INDEX IF EXISTS idx_groceries_org;
-- DROP INDEX IF EXISTS idx_groceries_checked;

-- nexo Database Schema
-- Base tables for the household management app

-- Users table (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user_id
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Organizations/Households table (synced from Clerk)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, -- Clerk org_id
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Organization members (synced from Clerk)
CREATE TABLE IF NOT EXISTS organization_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, user_id)
);

-- Events/Calendar table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_all_day INTEGER DEFAULT 0,
  color TEXT DEFAULT '#000000',
  -- Scope: personal (org_id is NULL) or household (org_id is set)
  created_by TEXT NOT NULL REFERENCES users(id),
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Shopping list table (groceries, household items, clothing, etc.)
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

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  date TEXT NOT NULL,
  -- Who paid
  payer_id TEXT NOT NULL REFERENCES users(id),
  -- Scope
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Expense splits (who owes what)
CREATE TABLE IF NOT EXISTS expense_splits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  is_settled INTEGER DEFAULT 0,
  settled_at TEXT
);

-- Chores/Tasks table
CREATE TABLE IF NOT EXISTS chores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly')),
  due_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  assigned_to TEXT REFERENCES users(id),
  completed_by TEXT REFERENCES users(id),
  completed_at TEXT,
  -- Scope
  created_by TEXT NOT NULL REFERENCES users(id),
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_org ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);

CREATE INDEX IF NOT EXISTS idx_shopping_items_org ON shopping_items(org_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_checked ON shopping_items(is_checked);
CREATE INDEX IF NOT EXISTS idx_shopping_items_type ON shopping_items(type);
CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON shopping_items(priority);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_payer ON expenses(payer_id);

CREATE INDEX IF NOT EXISTS idx_chores_org ON chores(org_id);
CREATE INDEX IF NOT EXISTS idx_chores_assigned ON chores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);

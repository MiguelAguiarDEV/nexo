-- Migration: Add API Keys table
-- Allows external access to the API via API keys

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- The actual key (hashed for security)
  key_hash TEXT NOT NULL UNIQUE,
  -- Key prefix for identification (first 8 chars, e.g., "nxk_abc1...")
  key_prefix TEXT NOT NULL,
  -- Owner
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Optional: scope to organization
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  -- Metadata
  name TEXT NOT NULL, -- User-friendly name like "n8n integration"
  -- Permissions (JSON array of allowed scopes)
  -- e.g., ["shopping:read", "shopping:write", "events:read"]
  scopes TEXT DEFAULT '["*"]', -- Default: all permissions
  -- Status
  is_active INTEGER DEFAULT 1,
  last_used_at TEXT,
  expires_at TEXT, -- NULL = never expires
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

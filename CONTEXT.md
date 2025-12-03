# NEXO - Project Context File

> **Last Updated:** 2024-12-03
> **Current Phase:** Ciclo 2.5 - Shopping Module (EXPANDED) + REST API

## Project Overview

**nexo** is a personal + household management SaaS application built with Next.js 16. It allows users to manage their personal tasks, finances, and calendar, as well as shared household resources with roommates.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Authentication | Clerk (with Organizations) |
| Database | Turso (LibSQL) |
| Validation | Zod |
| Forms | React Hook Form |
| Linting/Formatting | Biome |

## Architecture

### Hybrid Context System

The app uses a **scope-based filtering system**:

- **Personal Mode:** Data filtered by `userId` only
- **Household Mode:** Data filtered by `orgId` (Clerk Organization)

### API Access

The app exposes a **REST API** for external integrations (MCP, n8n, etc.):

- **Authentication:** API Keys via `X-API-Key` header
- **Scopes:** Fine-grained permissions (`shopping:read`, `shopping:write`, etc.)
- **CORS:** Enabled for external access

### Key Files

```text
lib/
├── auth.ts              # getSafeAuth() - Returns userId and orgId
├── db/index.ts          # Turso client connection
├── db/schema.sql        # Complete database schema
├── db/migrations/       # SQL migrations
├── navigation.ts        # Navigation items + admin config
├── utils.ts             # Utility functions (cn)
├── constants/
│   └── shopping.ts      # Item types and priority configs
├── api/
│   ├── keys.ts          # API key generation/validation
│   └── auth.ts          # API authentication middleware
└── validations/
    └── pantry.ts        # Zod schemas

app/
├── (dashboard)/
│   ├── shopping/        # Shopping list module
│   │   ├── actions.ts   # Server actions
│   │   ├── page.tsx
│   │   ├── shopping-page-client.tsx
│   │   ├── shopping-list.tsx
│   │   ├── add-item-drawer.tsx  # Mobile-friendly drawer
│   │   ├── type-filter.tsx
│   │   └── price-summary.tsx
│   └── admin/
│       └── api-keys/    # API key management (admin only)
├── api/
│   ├── shopping/        # REST API endpoints
│   │   ├── route.ts     # GET list, POST create
│   │   └── [id]/route.ts # GET, PATCH, DELETE single item
│   └── keys/            # API key management endpoints
│       ├── route.ts
│       ├── [id]/route.ts
│       └── generate/route.ts

types/
└── db.ts                # TypeScript interfaces + API scopes

components/
├── layouts/
│   ├── sidebar.tsx      # Desktop nav (with admin section)
│   └── mobile-nav.tsx   # Mobile sheet navigation
└── ui/                  # shadcn/ui components
    ├── drawer.tsx       # Mobile drawer (vaul)
    └── ...
```

## Database Schema

All tables use a **polymorphic scope pattern**:

- `created_by` (TEXT) - Always set to the user's ID
- `org_id` (TEXT, nullable) - Set when in household mode, NULL for personal

### Tables

- `users` - Synced from Clerk
- `organizations` - Clerk Organizations (households)
- `organization_members` - Membership tracking
- `events` - Calendar events
- `shopping_items` - Shopping list items (expanded from groceries)
- `expenses` - Financial transactions
- `expense_splits` - Split tracking for shared expenses
- `chores` - Household tasks
- `api_keys` - External API authentication

### Shopping Items Schema

```sql
CREATE TABLE shopping_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  type TEXT DEFAULT 'food',      -- food, kitchen, bathroom, cleaning, clothing, electronics, home, other
  category TEXT,
  priority INTEGER DEFAULT 4,     -- 1=urgent, 2=high, 3=medium, 4=low
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
);
```

### API Keys Schema

```sql
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  user_id TEXT NOT NULL,
  org_id TEXT,
  name TEXT NOT NULL,
  scopes TEXT DEFAULT '["*"]',    -- JSON array of permissions
  is_active INTEGER DEFAULT 1,
  last_used_at TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Completed Features (✓)

### Ciclo 0 - Infrastructure

- [x] Next.js 16 project setup with TypeScript
- [x] Biome linting/formatting configuration
- [x] shadcn/ui components installed
- [x] Turso database connection
- [x] Clerk authentication integration
- [x] Protected routes middleware
- [x] Auth pages (sign-in, sign-up, sso-callback)
- [x] Responsive layout with sidebar
- [x] Theme toggle (dark/light mode)

### Ciclo 1 - Data Engine

- [x] Complete SQL schema with indexes
- [x] TypeScript types for all entities
- [x] `getSafeAuth()` utility function
- [x] `getScope()` helper function

### Ciclo 2 - Shopping Module ✅ (Expanded from Pantry)

- [x] Server Actions (getItems, addItem, toggleItem, deleteItem, clearChecked, updateItem)
- [x] Zod validation schemas
- [x] Expanded schema: type, priority, price, url, notes
- [x] 8 item types: food, kitchen, bathroom, cleaning, clothing, electronics, home, other
- [x] Priority levels (1-4): urgent, high, medium, low
- [x] Mobile-friendly drawer for adding items (floating + button)
- [x] Type filtering with URL params
- [x] Price summary with selection support
- [x] Optimistic updates with useOptimistic
- [x] Renamed /pantry → /shopping

### Ciclo 2.5 - REST API ✅

- [x] API key authentication system
- [x] Scoped permissions (shopping:read, shopping:write, etc.)
- [x] CORS middleware for external access
- [x] Shopping REST endpoints:
  - GET /api/shopping - List items
  - POST /api/shopping - Create item
  - GET /api/shopping/:id - Get single item
  - PATCH /api/shopping/:id - Update item
  - DELETE /api/shopping/:id - Delete item
- [x] API key management endpoints
- [x] Admin UI for API keys (/admin/api-keys)
- [x] Admin section in sidebar (admin email only)

## Current Work - Ciclo 3: Calendar Module

### To Do

- [ ] Schema events (already defined)
- [ ] Server Actions for events (CRUD)
- [ ] Zod validation for events
- [ ] Calendar grid component (month view)
- [ ] Event creation modal/sheet
- [ ] Event detail view
- [ ] Personal vs household event styling

## Upcoming Work

### Ciclo 4: Finance Module

- Expense tracking
- Balance calculations
- Settlement flow

### Ciclo 5: Chores Module

- Task assignment
- Rotation logic
- Completion tracking

### Ciclo 6: Dashboard & Polish

- Home page widgets
- Empty states
- Loading skeletons
- Error boundaries

## Development Commands

```bash
# Development
bun dev

# Build
bun build

# Lint
bun lint

# Format
bun format
```

## Environment Variables

Required in `.env.local`:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
TURSO_URL=
TURSO_TOKEN=
```

## Code Patterns

### Server Action Pattern

```typescript
"use server";

import { getSafeAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function actionName(data: InputType) {
  const { userId, orgId } = await getSafeAuth();
  
  // Use orgId for household scope, userId for personal
  const scope = orgId ? { org_id: orgId } : { created_by: userId, org_id: null };
  
  // Execute query...
  
  revalidatePath("/path");
  return result;
}
```

### Scope-Based Query Pattern

```typescript
// Get items based on current scope
const items = orgId
  ? await db.execute("SELECT * FROM table WHERE org_id = ?", [orgId])
  : await db.execute("SELECT * FROM table WHERE created_by = ? AND org_id IS NULL", [userId]);
```

### Optimistic Updates Pattern

```typescript
"use client";
import { useOptimistic, useTransition } from "react";

// In component:
const [optimisticData, dispatch] = useOptimistic(data, reducer);
const [isPending, startTransition] = useTransition();

const handleAction = () => {
  dispatch({ type: "action", payload });
  startTransition(async () => {
    await serverAction(payload);
  });
};
```

## Notes for AI Agents

1. Always use `getSafeAuth()` for authenticated actions
2. Check `orgId` to determine scope (personal vs household)
3. Use Zod for input validation in server actions
4. Implement optimistic updates with `useOptimistic` hook
5. Keep components server-first, add "use client" only when needed
6. Follow existing patterns in `app/(dashboard)/shopping/actions.ts`
7. Use Spanish for user-facing text (labels, placeholders, messages)
8. **Always create REST API alongside server actions** for external access
9. Reference `lib/api/auth.ts` for API authentication pattern
10. Admin features restricted to `ADMIN_EMAIL` in `lib/navigation.ts`

## REST API Usage

### Authentication

All API requests require the `X-API-Key` header:

```bash
curl -X GET "https://your-domain/api/shopping" \
  -H "X-API-Key: nxk_your_api_key_here"
```

### Available Scopes

- `shopping:read` / `shopping:write`
- `events:read` / `events:write`
- `expenses:read` / `expenses:write`
- `chores:read` / `chores:write`
- `*` - All permissions

### API Key Management

- Create keys from `/admin/api-keys` (web UI)
- Or via `/api/keys/generate` endpoint (requires Clerk session)

# NEXO - Project Context File

> **Last Updated:** 2024-12-03
> **Current Phase:** Ciclo 2 - Módulo Despensa (COMPLETED) → Starting Ciclo 3

## Project Overview

**nexo** is a personal + household management SaaS application built with Next.js 15. It allows users to manage their personal tasks, finances, and calendar, as well as shared household resources with roommates.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
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

### Key Files

```text
lib/
├── auth.ts              # getSafeAuth() - Returns userId and orgId
├── db/index.ts          # Turso client connection
├── db/schema.sql        # Complete database schema
├── navigation.ts        # Navigation items config
├── utils.ts             # Utility functions (cn)
├── actions/
│   └── pantry.ts        # Server actions for groceries
└── validations/
    └── pantry.ts        # Zod schemas for groceries

types/
└── db.ts                # TypeScript interfaces for all entities

components/
├── layouts/
│   ├── sidebar.tsx      # Desktop navigation
│   └── mobile-nav.tsx   # Mobile sheet navigation
├── pantry/
│   ├── grocery-item.tsx     # Individual item with checkbox
│   ├── grocery-list.tsx     # List with optimistic updates
│   ├── add-grocery-form.tsx # Quick add form
│   └── clear-checked-button.tsx # Bulk clear action
└── ui/                  # shadcn/ui components
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
- `groceries` - Shopping list items
- `expenses` - Financial transactions
- `expense_splits` - Split tracking for shared expenses
- `chores` - Household tasks

## Completed Features (✓)

### Ciclo 0 - Infrastructure

- [x] Next.js 15 project setup with TypeScript
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

### Ciclo 2 - Pantry Module ✅

- [x] Server Actions (getGroceries, addGrocery, toggleGrocery, deleteGrocery, clearChecked)
- [x] Zod validation schemas
- [x] GroceryItem component with checkbox
- [x] GroceryList with optimistic updates using useOptimistic
- [x] AddGroceryForm with transitions
- [x] ClearCheckedButton for bulk actions
- [x] Empty state UI
- [x] Full pantry page integration

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
6. Follow existing patterns in `lib/actions/` and `components/`
7. Use Spanish for user-facing text (labels, placeholders, messages)
8. Reference `lib/actions/pantry.ts` as the canonical server action example

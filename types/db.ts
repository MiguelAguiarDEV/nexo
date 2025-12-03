// Scope type for filtering data
export type Scope = "personal" | "household";

// Base fields for all entities
export interface BaseEntity {
  created_by: string;
  org_id: string | null;
  created_at: string;
}

// User (synced from Clerk)
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Organization/Household (synced from Clerk)
export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Organization member
export interface OrganizationMember {
  id: number;
  org_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}

// Event
export interface Event extends BaseEntity {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_all_day: boolean;
  color: string;
  updated_at: string;
}

// Shopping item types
export const ITEM_TYPES = [
  "food",
  "kitchen",
  "bathroom",
  "cleaning",
  "clothing",
  "electronics",
  "home",
  "other",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

// Priority levels (1 = urgent, 4 = low)
export const PRIORITY_LEVELS = [1, 2, 3, 4] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

// Shopping item (replaces Grocery)
export interface ShoppingItem extends BaseEntity {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  type: ItemType;
  category: string | null;
  priority: Priority;
  price: number | null;
  currency: string;
  url: string | null;
  notes: string | null;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
}

// Legacy alias (for backwards compatibility during transition)
export type Grocery = ShoppingItem;

// Expense
export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  payer_id: string;
  org_id: string | null;
  created_at: string;
}

// Expense split
export interface ExpenseSplit {
  id: number;
  expense_id: number;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
}

// Chore
export interface Chore extends BaseEntity {
  id: number;
  title: string;
  description: string | null;
  frequency: "once" | "daily" | "weekly" | "monthly" | null;
  due_date: string | null;
  status: "pending" | "completed";
  assigned_to: string | null;
  completed_by: string | null;
  completed_at: string | null;
  updated_at: string;
}

// API Key
export interface ApiKey {
  id: number;
  key_hash: string;
  key_prefix: string;
  user_id: string;
  org_id: string | null;
  name: string;
  scopes: string[]; // Parsed from JSON
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// API Key scopes
export const API_SCOPES = [
  "*", // All permissions
  "shopping:read",
  "shopping:write",
  "events:read",
  "events:write",
  "expenses:read",
  "expenses:write",
  "chores:read",
  "chores:write",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

// Insert types (for creating new records)
export type InsertEvent = Omit<Event, "id" | "created_at" | "updated_at">;
export type InsertGrocery = Omit<
  Grocery,
  "id" | "created_at" | "checked_by" | "checked_at"
>;
export type InsertExpense = Omit<Expense, "id" | "created_at">;
export type InsertChore = Omit<
  Chore,
  "id" | "created_at" | "updated_at" | "completed_by" | "completed_at"
>;

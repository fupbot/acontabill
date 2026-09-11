import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Every table's `id` is a client-generated UUID (see db/ids.ts), not an
// autoincrement integer. That matters once sync (Phase 5) exists: two
// phones creating records offline must never collide on id, which
// autoincrement can't guarantee across devices but a UUID can.

// Single-row table (id is always "singleton") holding this device's own
// local settings. currentUserId marks which `users` row is "you" on this
// phone — there's no login yet (device pairing/identity is Phase 5), so the
// app creates one on first launch and remembers it here.
export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  currentUserId: text("current_user_id"),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// A group's admin is whichever user has role "admin" here — see
// REQUIREMENTS.md §3 (admin can remove members / manage categories; any
// member can edit or delete any expense). Enforced by
// shared-core/src/permissions, not by the schema itself.
export const groupMemberships = sqliteTable("group_memberships", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role", { enum: ["admin", "member"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Scoped per-group, not global: REQUIREMENTS.md §3 ties "manage categories"
// to the group admin, so each group gets its own editable copy of the
// bundled defaults (seeded at group creation) rather than one shared list.
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  description: text("description").notNull(),
  // Integer cents, never a float — see shared-core/src/splitting/equal-split.ts.
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  paidByUserId: text("paid_by_user_id")
    .notNull()
    .references(() => users.id),
  splitType: text("split_type", { enum: ["equal", "percentage", "exact", "shares"] })
    .notNull()
    .default("equal"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const expenseSplits = sqliteTable("expense_splits", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  amountCents: integer("amount_cents").notNull(),
});

// A direct payment from one member to another to settle up part (or all) of
// what balances/simplify-debts.ts says they owe. Always a single currency,
// matching the debt it settles (REQUIREMENTS.md §3).
export const settlements = sqliteTable("settlements", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  currency: text("currency").notNull(),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: text("to_user_id")
    .notNull()
    .references(() => users.id),
  amountCents: integer("amount_cents").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

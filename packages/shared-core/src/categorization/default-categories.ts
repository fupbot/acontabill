/**
 * Bundled default categories (REQUIREMENTS.md §3.1) — seeded into every new
 * group so it's never a cold start, and freely editable/extendable by users
 * afterwards. Keyword-based suggestion and learned categorization (also in
 * §3.1) are a separate follow-up, not required for basic category CRUD.
 */
export const DEFAULT_CATEGORY_NAMES = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Travel",
  "Other",
] as const;

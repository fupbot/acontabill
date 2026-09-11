export type GroupRole = "admin" | "member";

/**
 * Centralizes the authorization rules from REQUIREMENTS.md §3: the group
 * admin can remove members and manage categories; any member (including
 * non-admins) can edit or delete any expense (Splitwise's trust-based
 * behavior — no per-expense ownership lock). Kept as tiny pure functions so
 * the rule is defined once and can't drift between screens.
 */
export function canRemoveMember(role: GroupRole): boolean {
  return role === "admin";
}

export function canManageCategories(role: GroupRole): boolean {
  return role === "admin";
}

export function canEditOrDeleteExpense(_role: GroupRole): boolean {
  return true;
}

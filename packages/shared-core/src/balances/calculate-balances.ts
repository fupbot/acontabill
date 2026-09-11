import type { BalancePosting } from "./postings";

/**
 * Net balance per user, per currency — never mixed across currencies
 * (REQUIREMENTS.md §3: multi-currency balances are tracked and simplified
 * independently, no conversion). Positive = the group owes this user;
 * negative = this user owes the group.
 */
export type BalancesByCurrency = Record<string, Record<string, number>>;

export function calculateBalances(postings: BalancePosting[]): BalancesByCurrency {
  const balances: BalancesByCurrency = {};

  for (const posting of postings) {
    const byUser = (balances[posting.currency] ??= {});
    byUser[posting.userId] = (byUser[posting.userId] ?? 0) + posting.amountCents;
  }

  return balances;
}

import {
  splitExpenseByExactAmounts,
  splitExpenseByPercentage,
  splitExpenseByShares,
  splitExpenseEqually,
  type ExpenseSplitResult,
} from "@acontabill/shared-core";

/**
 * One shape covering all 4 split types (REQUIREMENTS.md §3), so the create
 * and edit expense flows can share the same dispatch logic instead of each
 * re-implementing "which shared-core function do I call for this type."
 */
export type SplitConfig =
  | { type: "equal"; participantUserIds: string[] }
  | { type: "percentage"; entries: { userId: string; percentage: number }[] }
  | { type: "exact"; entries: { userId: string; amountCents: number }[] }
  | { type: "shares"; entries: { userId: string; shares: number }[] };

export function computeSplits(amountCents: number, config: SplitConfig): ExpenseSplitResult[] {
  switch (config.type) {
    case "equal":
      return splitExpenseEqually(amountCents, config.participantUserIds);
    case "percentage":
      return splitExpenseByPercentage(amountCents, config.entries);
    case "exact":
      return splitExpenseByExactAmounts(amountCents, config.entries);
    case "shares":
      return splitExpenseByShares(amountCents, config.entries);
  }
}

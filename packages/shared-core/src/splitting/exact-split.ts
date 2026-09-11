import type { ExpenseSplitResult } from "./expense-splits";

/**
 * Exact amounts are user-specified directly, so there's no rounding to do —
 * just a strict check that they add up to the expense total.
 */
export function splitExpenseByExactAmounts(
  totalCents: number,
  inputs: ExpenseSplitResult[],
): ExpenseSplitResult[] {
  if (inputs.length === 0) {
    throw new Error("An expense needs at least one participant");
  }

  const sum = inputs.reduce((total, input) => total + input.amountCents, 0);
  if (sum !== totalCents) {
    throw new Error(`Exact amounts must sum to the total (got ${sum}, expected ${totalCents})`);
  }

  return inputs;
}

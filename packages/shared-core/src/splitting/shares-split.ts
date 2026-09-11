import type { ExpenseSplitResult } from "./expense-splits";

export interface ShareSplitInput {
  userId: string;
  shares: number;
}

/**
 * Proportional split by integer "shares" (e.g. one housemate with 2 shares
 * pays twice what a 1-share housemate pays). Same floor-then-remainder-on-
 * last-entry rounding convention as the rest of the splitting module.
 */
export function splitExpenseByShares(
  totalCents: number,
  inputs: ShareSplitInput[],
): ExpenseSplitResult[] {
  if (inputs.length === 0) {
    throw new Error("An expense needs at least one participant");
  }
  if (inputs.some((input) => !Number.isInteger(input.shares) || input.shares < 0)) {
    throw new Error("Shares must be non-negative integers");
  }

  const totalShares = inputs.reduce((sum, input) => sum + input.shares, 0);
  if (totalShares <= 0) {
    throw new Error("Total shares must be greater than zero");
  }

  const amounts = inputs.map((input) => Math.floor((totalCents * input.shares) / totalShares));
  const amountsSum = amounts.reduce((sum, amount) => sum + amount, 0);
  const remainder = totalCents - amountsSum;
  amounts[amounts.length - 1] = (amounts[amounts.length - 1] ?? 0) + remainder;

  return inputs.map((input, index) => ({ userId: input.userId, amountCents: amounts[index] ?? 0 }));
}

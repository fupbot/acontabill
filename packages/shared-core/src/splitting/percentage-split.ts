import type { ExpenseSplitResult } from "./expense-splits";

export interface PercentageSplitInput {
  userId: string;
  percentage: number;
}

const PERCENTAGE_SUM_TOLERANCE = 0.001;

/**
 * Percentages must sum to 100 (within floating-point tolerance — the UI
 * collects these as decimal input, e.g. 33.33 + 33.33 + 33.34). Rounding
 * drift from converting each percentage to cents is corrected on the last
 * entry, same convention as splitAmountEqually.
 */
export function splitExpenseByPercentage(
  totalCents: number,
  inputs: PercentageSplitInput[],
): ExpenseSplitResult[] {
  if (inputs.length === 0) {
    throw new Error("An expense needs at least one participant");
  }

  const totalPercentage = inputs.reduce((sum, input) => sum + input.percentage, 0);
  if (Math.abs(totalPercentage - 100) > PERCENTAGE_SUM_TOLERANCE) {
    throw new Error(`Percentages must sum to 100 (got ${totalPercentage})`);
  }

  const amounts = inputs.map((input) => Math.round((totalCents * input.percentage) / 100));
  const amountsSum = amounts.reduce((sum, amount) => sum + amount, 0);
  const drift = totalCents - amountsSum;
  amounts[amounts.length - 1] = (amounts[amounts.length - 1] ?? 0) + drift;

  return inputs.map((input, index) => ({ userId: input.userId, amountCents: amounts[index] ?? 0 }));
}

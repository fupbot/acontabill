import { splitAmountEqually } from "./equal-split";

export interface ExpenseSplitResult {
  userId: string;
  amountCents: number;
}

/**
 * Equal split only — the other split types (percentage/exact/shares) and
 * debt simplification are Phase 3 work (REQUIREMENTS.md §12). This is the
 * minimum needed for Phase 2's basic expense CRUD to produce a valid,
 * balances-ready set of splits.
 */
export function splitExpenseEqually(
  totalCents: number,
  participantUserIds: string[],
): ExpenseSplitResult[] {
  if (participantUserIds.length === 0) {
    throw new Error("An expense needs at least one participant");
  }

  const amounts = splitAmountEqually(totalCents, participantUserIds.length);

  return participantUserIds.map((userId, index) => ({
    userId,
    amountCents: amounts[index] as number,
  }));
}

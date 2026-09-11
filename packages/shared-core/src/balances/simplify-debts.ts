export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

/**
 * Greedy debt simplification: repeatedly match the largest creditor with
 * the largest debtor and settle the smaller of the two amounts, until
 * everyone is at zero. This is the standard heuristic used for "minimize
 * the number of settling transactions" (REQUIREMENTS.md §3) — it isn't
 * guaranteed to find the mathematically absolute minimum in every case
 * (that's a harder optimization problem), but it's the well-known
 * practical approach and produces good results for typical group sizes.
 * Implemented from scratch, not adapted from Splitwise (REQUIREMENTS.md §10).
 */
export function simplifyDebts(balances: Record<string, number>): SimplifiedDebt[] {
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > 0)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < 0)
    .map(([userId, amount]) => ({ userId, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    if (!creditor || !debtor) {
      break;
    }

    const amount = Math.min(creditor.amount, debtor.amount);
    transactions.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents: amount,
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) {
      creditors.shift();
    }
    if (debtor.amount === 0) {
      debtors.shift();
    }
  }

  return transactions;
}

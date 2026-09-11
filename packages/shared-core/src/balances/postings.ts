/**
 * A posting is the smallest unit of balance math: "this user's net position
 * changed by this many cents, in this currency." An expense turns into one
 * positive posting (the payer fronted the money) and one negative posting
 * per participant (their share of the debt); a settlement turns into one
 * positive posting (whoever paid) and one negative posting (whoever
 * received). Reducing everything to this one shape is what lets
 * calculateBalances (see calculate-balances.ts) be a single dumb summation
 * instead of knowing about expenses or settlements at all.
 */
export interface BalancePosting {
  currency: string;
  userId: string;
  amountCents: number;
}

export interface ExpenseForBalance {
  currency: string;
  paidByUserId: string;
  amountCents: number;
  splits: { userId: string; amountCents: number }[];
}

export function postingsForExpense(expense: ExpenseForBalance): BalancePosting[] {
  const postings: BalancePosting[] = [
    { currency: expense.currency, userId: expense.paidByUserId, amountCents: expense.amountCents },
  ];

  for (const split of expense.splits) {
    postings.push({
      currency: expense.currency,
      userId: split.userId,
      amountCents: -split.amountCents,
    });
  }

  return postings;
}

export interface SettlementForBalance {
  currency: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

export function postingsForSettlement(settlement: SettlementForBalance): BalancePosting[] {
  return [
    {
      currency: settlement.currency,
      userId: settlement.fromUserId,
      amountCents: settlement.amountCents,
    },
    {
      currency: settlement.currency,
      userId: settlement.toUserId,
      amountCents: -settlement.amountCents,
    },
  ];
}

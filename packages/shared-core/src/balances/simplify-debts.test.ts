import { describe, expect, it } from "vitest";

import { simplifyDebts } from "./simplify-debts";

function totalPerUser(transactions: ReturnType<typeof simplifyDebts>) {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    totals[tx.fromUserId] = (totals[tx.fromUserId] ?? 0) - tx.amountCents;
    totals[tx.toUserId] = (totals[tx.toUserId] ?? 0) + tx.amountCents;
  }
  return totals;
}

describe("simplifyDebts", () => {
  it("produces a single transaction for a simple two-person debt", () => {
    const transactions = simplifyDebts({ alice: 1000, bob: -1000 });

    expect(transactions).toEqual([{ fromUserId: "bob", toUserId: "alice", amountCents: 1000 }]);
  });

  it("ignores users who are already settled", () => {
    expect(simplifyDebts({ alice: 0, bob: 0 })).toEqual([]);
  });

  it("settles a three-person cycle in the minimum 2 transactions instead of 3", () => {
    // Classic case: A paid for everyone, B paid C back partially — a naive
    // "every pair settles separately" approach would need 3 transactions;
    // simplification should collapse it to 2.
    const balances = { alice: 2000, bob: -500, carol: -1500 };

    const transactions = simplifyDebts(balances);

    expect(transactions.length).toBeLessThanOrEqual(2);
    expect(totalPerUser(transactions)).toEqual(balances);
  });

  it("always results in net-zero movement matching the input balances", () => {
    const balances = { alice: 5000, bob: 3000, carol: -4000, dave: -4000 };

    const transactions = simplifyDebts(balances);

    expect(totalPerUser(transactions)).toEqual(balances);
    // At most (participants - 1) transactions for a fully-connected settlement.
    expect(transactions.length).toBeLessThanOrEqual(Object.keys(balances).length - 1);
  });

  it("handles an already-simplified single creditor/debtor pair without extra transactions", () => {
    const transactions = simplifyDebts({ alice: 100, bob: -60, carol: -40 });

    expect(transactions).toEqual([
      { fromUserId: "bob", toUserId: "alice", amountCents: 60 },
      { fromUserId: "carol", toUserId: "alice", amountCents: 40 },
    ]);
  });
});

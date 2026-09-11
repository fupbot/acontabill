import { describe, expect, it } from "vitest";

import { calculateBalances } from "./calculate-balances";
import { postingsForExpense, postingsForSettlement } from "./postings";

describe("calculateBalances", () => {
  it("nets postings per user, per currency", () => {
    const postings = [
      ...postingsForExpense({
        currency: "BRL",
        paidByUserId: "alice",
        amountCents: 9000,
        splits: [
          { userId: "alice", amountCents: 3000 },
          { userId: "bob", amountCents: 3000 },
          { userId: "carol", amountCents: 3000 },
        ],
      }),
      ...postingsForSettlement({
        currency: "BRL",
        fromUserId: "bob",
        toUserId: "alice",
        amountCents: 1000,
      }),
    ];

    expect(calculateBalances(postings)).toEqual({
      BRL: {
        alice: 5000,
        bob: -2000,
        carol: -3000,
      },
    });
  });

  it("keeps different currencies fully separate", () => {
    const postings = [
      ...postingsForExpense({
        currency: "USD",
        paidByUserId: "alice",
        amountCents: 1000,
        splits: [
          { userId: "alice", amountCents: 500 },
          { userId: "bob", amountCents: 500 },
        ],
      }),
      ...postingsForExpense({
        currency: "BRL",
        paidByUserId: "bob",
        amountCents: 2000,
        splits: [
          { userId: "alice", amountCents: 1000 },
          { userId: "bob", amountCents: 1000 },
        ],
      }),
    ];

    const balances = calculateBalances(postings);
    expect(balances.USD).toEqual({ alice: 500, bob: -500 });
    expect(balances.BRL).toEqual({ alice: -1000, bob: 1000 });
  });

  it("always nets to zero for a closed group of postings", () => {
    const postings = postingsForExpense({
      currency: "BRL",
      paidByUserId: "alice",
      amountCents: 10000,
      splits: [
        { userId: "alice", amountCents: 3333 },
        { userId: "bob", amountCents: 3333 },
        { userId: "carol", amountCents: 3334 },
      ],
    });

    const balances = calculateBalances(postings);
    const sum = Object.values(balances.BRL ?? {}).reduce((total, amount) => total + amount, 0);
    expect(sum).toBe(0);
  });
});

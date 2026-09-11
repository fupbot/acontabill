import { describe, expect, it } from "vitest";

import { postingsForExpense, postingsForSettlement } from "./postings";

describe("postingsForExpense", () => {
  it("credits the payer the full amount and debits each participant their share", () => {
    const postings = postingsForExpense({
      currency: "BRL",
      paidByUserId: "alice",
      amountCents: 9000,
      splits: [
        { userId: "alice", amountCents: 3000 },
        { userId: "bob", amountCents: 3000 },
        { userId: "carol", amountCents: 3000 },
      ],
    });

    expect(postings).toEqual([
      { currency: "BRL", userId: "alice", amountCents: 9000 },
      { currency: "BRL", userId: "alice", amountCents: -3000 },
      { currency: "BRL", userId: "bob", amountCents: -3000 },
      { currency: "BRL", userId: "carol", amountCents: -3000 },
    ]);

    // Net effect for the payer nets out to what others still owe them.
    const aliceNet = postings
      .filter((p) => p.userId === "alice")
      .reduce((sum, p) => sum + p.amountCents, 0);
    expect(aliceNet).toBe(6000);
  });
});

describe("postingsForSettlement", () => {
  it("moves the payer's balance up and the receiver's balance down by the same amount", () => {
    const postings = postingsForSettlement({
      currency: "BRL",
      fromUserId: "bob",
      toUserId: "alice",
      amountCents: 3000,
    });

    expect(postings).toEqual([
      { currency: "BRL", userId: "bob", amountCents: 3000 },
      { currency: "BRL", userId: "alice", amountCents: -3000 },
    ]);
  });
});

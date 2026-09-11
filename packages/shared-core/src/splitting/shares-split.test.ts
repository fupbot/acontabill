import { describe, expect, it } from "vitest";

import { splitExpenseByShares } from "./shares-split";

describe("splitExpenseByShares", () => {
  it("splits proportionally to each participant's shares", () => {
    const result = splitExpenseByShares(9000, [
      { userId: "alice", shares: 2 },
      { userId: "bob", shares: 1 },
    ]);

    expect(result).toEqual([
      { userId: "alice", amountCents: 6000 },
      { userId: "bob", amountCents: 3000 },
    ]);
  });

  it("puts rounding remainder on the last entry and still sums to the total", () => {
    const result = splitExpenseByShares(10000, [
      { userId: "alice", shares: 1 },
      { userId: "bob", shares: 1 },
      { userId: "carol", shares: 1 },
    ]);

    expect(result).toEqual([
      { userId: "alice", amountCents: 3333 },
      { userId: "bob", amountCents: 3333 },
      { userId: "carol", amountCents: 3334 },
    ]);
  });

  it("rejects zero total shares", () => {
    expect(() =>
      splitExpenseByShares(1000, [
        { userId: "alice", shares: 0 },
        { userId: "bob", shares: 0 },
      ]),
    ).toThrow();
  });

  it("rejects non-integer or negative shares", () => {
    expect(() => splitExpenseByShares(1000, [{ userId: "alice", shares: 1.5 }])).toThrow();
    expect(() => splitExpenseByShares(1000, [{ userId: "alice", shares: -1 }])).toThrow();
  });

  it("rejects an empty participant list", () => {
    expect(() => splitExpenseByShares(1000, [])).toThrow();
  });
});

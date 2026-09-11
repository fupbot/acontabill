import { describe, expect, it } from "vitest";

import { splitExpenseByPercentage } from "./percentage-split";

describe("splitExpenseByPercentage", () => {
  it("splits proportionally and sums exactly to the total", () => {
    const result = splitExpenseByPercentage(10000, [
      { userId: "alice", percentage: 50 },
      { userId: "bob", percentage: 25 },
      { userId: "carol", percentage: 25 },
    ]);

    expect(result).toEqual([
      { userId: "alice", amountCents: 5000 },
      { userId: "bob", amountCents: 2500 },
      { userId: "carol", amountCents: 2500 },
    ]);
  });

  it("absorbs rounding drift on the last entry", () => {
    const result = splitExpenseByPercentage(10000, [
      { userId: "alice", percentage: 33.33 },
      { userId: "bob", percentage: 33.33 },
      { userId: "carol", percentage: 33.34 },
    ]);

    expect(result.reduce((sum, split) => sum + split.amountCents, 0)).toBe(10000);
  });

  it("rejects percentages that don't sum to 100", () => {
    expect(() =>
      splitExpenseByPercentage(10000, [
        { userId: "alice", percentage: 50 },
        { userId: "bob", percentage: 40 },
      ]),
    ).toThrow();
  });

  it("rejects an empty participant list", () => {
    expect(() => splitExpenseByPercentage(10000, [])).toThrow();
  });
});

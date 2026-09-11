import { describe, expect, it } from "vitest";

import { splitExpenseByExactAmounts } from "./exact-split";

describe("splitExpenseByExactAmounts", () => {
  it("passes through amounts that sum to the total", () => {
    const inputs = [
      { userId: "alice", amountCents: 6000 },
      { userId: "bob", amountCents: 4000 },
    ];

    expect(splitExpenseByExactAmounts(10000, inputs)).toEqual(inputs);
  });

  it("rejects amounts that don't sum to the total", () => {
    expect(() =>
      splitExpenseByExactAmounts(10000, [
        { userId: "alice", amountCents: 6000 },
        { userId: "bob", amountCents: 3000 },
      ]),
    ).toThrow();
  });

  it("rejects an empty participant list", () => {
    expect(() => splitExpenseByExactAmounts(10000, [])).toThrow();
  });
});

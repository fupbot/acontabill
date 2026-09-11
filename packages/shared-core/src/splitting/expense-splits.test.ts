import { describe, expect, it } from "vitest";

import { splitExpenseEqually } from "./expense-splits";

describe("splitExpenseEqually", () => {
  it("assigns one split per participant, summing to the total", () => {
    const result = splitExpenseEqually(10000, ["alice", "bob", "carol"]);

    expect(result).toEqual([
      { userId: "alice", amountCents: 3333 },
      { userId: "bob", amountCents: 3333 },
      { userId: "carol", amountCents: 3334 },
    ]);
  });

  it("rejects an empty participant list", () => {
    expect(() => splitExpenseEqually(1000, [])).toThrow();
  });
});

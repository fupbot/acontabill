import { describe, expect, it } from "vitest";

import { splitAmountEqually } from "./equal-split";

describe("splitAmountEqually", () => {
  it("splits evenly when the amount divides cleanly", () => {
    expect(splitAmountEqually(9000, 3)).toEqual([3000, 3000, 3000]);
  });

  it("puts the rounding remainder on the last part (R$100 / 3 example from REQUIREMENTS.md)", () => {
    expect(splitAmountEqually(10000, 3)).toEqual([3333, 3333, 3334]);
  });

  it("returns the full amount when splitting into a single part", () => {
    expect(splitAmountEqually(4999, 1)).toEqual([4999]);
  });

  it("handles an amount smaller than the number of parts", () => {
    expect(splitAmountEqually(2, 3)).toEqual([0, 0, 2]);
  });

  it("always sums back to the original total", () => {
    for (const [total, parts] of [
      [10000, 3],
      [101, 7],
      [1, 1],
      [999999, 13],
    ] as const) {
      const amounts = splitAmountEqually(total, parts);
      expect(amounts.reduce((sum, cents) => sum + cents, 0)).toBe(total);
      expect(amounts).toHaveLength(parts);
    }
  });

  it("rejects a non-integer amount", () => {
    expect(() => splitAmountEqually(10.5, 2)).toThrow();
  });

  it("rejects zero or negative parts", () => {
    expect(() => splitAmountEqually(100, 0)).toThrow();
    expect(() => splitAmountEqually(100, -1)).toThrow();
  });
});

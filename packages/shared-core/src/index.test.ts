import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORY_NAMES, splitExpenseEqually } from "./index";

describe("shared-core public exports", () => {
  it("re-exports the pieces mobile/backend are expected to import", () => {
    expect(DEFAULT_CATEGORY_NAMES.length).toBeGreaterThan(0);
    expect(splitExpenseEqually(100, ["a"])).toEqual([{ userId: "a", amountCents: 100 }]);
  });
});

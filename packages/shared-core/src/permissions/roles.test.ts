import { describe, expect, it } from "vitest";

import { canEditOrDeleteExpense, canManageCategories, canRemoveMember } from "./roles";

describe("group role permissions", () => {
  it("only admins can remove members", () => {
    expect(canRemoveMember("admin")).toBe(true);
    expect(canRemoveMember("member")).toBe(false);
  });

  it("only admins can manage categories", () => {
    expect(canManageCategories("admin")).toBe(true);
    expect(canManageCategories("member")).toBe(false);
  });

  it("any member can edit or delete any expense", () => {
    expect(canEditOrDeleteExpense("admin")).toBe(true);
    expect(canEditOrDeleteExpense("member")).toBe(true);
  });
});

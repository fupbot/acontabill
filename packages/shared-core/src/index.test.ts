import { describe, expect, it } from "vitest";

import { SHARED_CORE_PACKAGE_NAME } from "./index";

describe("shared-core package scaffold", () => {
  it("exposes its package name as a sanity check for the build/test pipeline", () => {
    expect(SHARED_CORE_PACKAGE_NAME).toBe("@acontabill/shared-core");
  });
});

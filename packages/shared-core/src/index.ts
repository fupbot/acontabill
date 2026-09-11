// Placeholder entry point for the shared-core package.
//
// This package will hold the four algorithms shared unchanged by the mobile
// app and the backend (see REQUIREMENTS.md §8): split math, debt
// simplification, categorization matching, and installment rounding.
// Those land in Phase 3/4 of the roadmap — this file just proves the
// TypeScript build + Vitest pipeline works end to end for this package.
export const SHARED_CORE_PACKAGE_NAME = "@acontabill/shared-core";

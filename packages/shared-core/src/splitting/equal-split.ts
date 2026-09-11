/**
 * All money in this package is represented as integer cents (the smallest
 * unit of the currency) — never floating-point decimals. This sidesteps the
 * classic 0.1 + 0.2 !== 0.3 problem entirely for a domain where exact
 * cent-level correctness matters (a split that's off by a fraction of a
 * cent, multiplied across users, is a real bug in a finance app).
 */
export function splitAmountEqually(totalCents: number, parts: number): number[] {
  if (!Number.isInteger(totalCents)) {
    throw new Error("totalCents must be an integer number of cents");
  }
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new Error("parts must be a positive integer");
  }

  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;

  // Remainder goes to the last part — matches the installment rounding rule
  // in REQUIREMENTS.md §4 (e.g. R$100 / 3 -> 33.33, 33.33, 33.34), reused
  // here for equal expense splits for the same reason: one convention for
  // "divide an integer amount into N parts" everywhere in the codebase.
  return Array.from({ length: parts }, (_, index) =>
    index === parts - 1 ? base + remainder : base,
  );
}

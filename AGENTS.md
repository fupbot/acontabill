# Agent Working Guidelines — "A conta, Bill!"

Repo-scoped rules for any AI agent (Claude Code or otherwise) working on this
project. These are process/collaboration rules, not product requirements —
see `REQUIREMENTS.md` for the spec.

## Environment

- Development happens on **WSL2, Ubuntu 24.04**.
- Working branch: **`dev`**.

## Git — hands off

- **Never run `git add`, `git commit`, or `git push`.** All git actions
  (staging, committing, pushing) are performed manually by the user, always.
- This includes after finishing a phase of the roadmap — do not commit
  automatically. Leave the working tree as-is and let the user commit.
- It's fine to run read-only git commands (`git status`, `git diff`, `git log`)
  to understand repo state.

## Testing

- Write unit tests for the "core" functionality of the app: the algorithms in
  `shared/core` (split math, debt simplification, categorization matching,
  installment rounding) are the highest priority for test coverage, since
  they're shared unchanged across mobile and backend.
- Extend to other meaningfully testable logic (sync log reconciliation,
  balance calculation) as it's built, without over-testing trivial
  UI/plumbing code.

## Explain as you go

- The user is learning full-stack app development through this project and
  wants to understand what's being built, not just receive finished code.
- When implementing something interesting or architecturally significant
  (e.g. why a monorepo package is structured a certain way, how the sync
  protocol works, why a particular library/pattern was chosen), pause and
  explain it in plain terms before or after the change — keep it concise,
  not a deep dive, but enough for the underlying mechanism to make sense.
- Routine/mechanical work (boilerplate config, straightforward CRUD) doesn't
  need this treatment — reserve it for decisions and mechanisms worth
  understanding.

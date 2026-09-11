# acontabill

"A conta, Bill!" — an open source (MIT), local-first expense-splitting app with
one feature Splitwise doesn't have: installment payments. See
[REQUIREMENTS.md](./REQUIREMENTS.md) for the full product/architecture spec
and [AGENTS.md](./AGENTS.md) for repo-specific working guidelines.

## Repo layout

pnpm workspace monorepo:

- `packages/shared-core` — algorithms shared unchanged by mobile and backend
  (split math, debt simplification, categorization, installment rounding)
- `apps/backend` — Node.js + Fastify local sync/backup server (also serves
  the BI dashboard)
- `apps/mobile` — React Native (Expo) mobile client
- `apps/dashboard` — React BI dashboard, built and served by the backend

## Getting started

Requires Node 22+ and pnpm (`corepack enable` or `npm i -g pnpm`).

```sh
pnpm install       # install all workspace dependencies
pnpm build         # build every package
pnpm test          # run all unit tests
pnpm lint          # lint every package
pnpm typecheck     # typecheck every package
pnpm format        # format the repo with Prettier
```

Per package, e.g. to run just the backend in dev mode:

```sh
pnpm --filter @acontabill/backend dev
```

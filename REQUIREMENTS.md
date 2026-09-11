# Project Requirements: "A conta, Bill!" — Open Source Expense Splitting App

## 1. Vision

An open source (MIT-licensed), Splitwise-like expense-sharing app with one major
differentiating feature: **installment payments** (common in Brazil / "parcelamento"
culture), which Splitwise and its major competitors do not support.

Core principle: **local-first, self-hosted by default.** No third-party cloud server
ever touches user data unless the user explicitly opts into the paid hosted tier.

Initial audience: personal use, then family and friends as a pilot. Longer term:
possible monetization via a one-time app purchase (self-hosted mode) plus an optional
paid subscription for a hosted sync server.

## 2. Competitive Landscape (benchmarks)

| App | Model | Open source | Self-hostable | Installments |
|---|---|---|---|---|
| Splitwise | Freemium, ads on free tier | No | No | No |
| Spliit | Free, MIT | Yes | Yes | No |
| Tricount | Free | No | No | No |
| Settle Up | Freemium | No | No | No |
| Splid | Free + one-time IAP, offline-first | No | No | No |
| HippoSplit | Freemium | No | No | No |

**Positioning:** closest structural precedent is Spliit (open, MIT, self-hosted) crossed
with Splid's offline-first design — plus installments, which is unclaimed territory.

## 3. Core Features (MVP parity with Splitwise)

- Users and groups — **no separate "friends" concept**; every expense belongs to a
  group, even a 2-person one (simpler data model, one relationship type to sync)
- Group roles: an **admin** (the person who set up the group/desktop) can remove
  members and manage categories; **any member can edit or delete any expense**
  (matches Splitwise's trust-based behavior, no per-expense ownership lock)
- Expenses with description, amount, date, category, currency
- Split types: equal, percentage, exact amount, shares
- Balance calculation ("who owes whom") — **per-currency, kept separate.** If a group
  has expenses in both USD and BRL, balances/debts are tracked and simplified
  independently per currency; no exchange-rate conversion or cross-currency netting
- Debt simplification (minimize number of settling transactions — standard
  network-flow/greedy algorithm, implemented independently, not copied from Splitwise),
  run separately per currency
- Settlements / recording payments (each settlement is in a single currency, matching
  the debt it settles)
- Multi-currency support: **currency field included in the data model from the start**
  (MVP), even though conversion UI/logic is out of scope until it's needed

### 3.1 Smart Categorization

- Ships with a **default set of categories** (Food, Transport, Rent, etc.), editable
  and extendable by users — not a cold start
- **Keyword-based suggestion:** as the user types an expense description, suggest a
  category from a static keyword dictionary in **both Portuguese (PT-BR) and English**
  (e.g. "gasoline"/"gasolina" → Car). Matching runs against the normalized
  (lowercased, accent-stripped) description — no network call, no ML model, fully offline
- **Learned categorization:** the app remembers the category a user picked for a given
  description (e.g. "Big Bom" → Supermarket) and auto-applies it next time the exact
  same normalized description is entered (**exact match only, no fuzzy/substring
  matching** — avoids false-positive suggestions on similarly-named merchants).
  Learned mappings are scoped to the group, so a household's habits are shared across
  its members, and take priority over the static keyword dictionary when both match
- **Custom categories:** users can freely create new categories (beyond the bundled
  defaults) for group-specific or uncommon spending types; no fixed/closed category enum

## 4. Differentiating Feature: Installments

- An expense can be split into N installments, each with its own due date, amount,
  and paid/pending status
- **Splitting logic:** equal split by default (total / N), with the rounding remainder
  applied to the **last installment** (e.g. R$100 / 3 → R$33.33, R$33.33, R$33.34) —
  matches how Brazilian parcelamento typically rounds. Manual per-installment amount
  override is allowed for real-world cases (e.g. an uneven first installment), as long
  as the set still sums to the expense total
- Installments count individually toward balance calculations
- Reminders/notifications for upcoming installment due dates (stretch) — delivered as
  **local device notifications only** (e.g. `expo-notifications`), scheduled
  entirely on-device. No FCM/APNs push, to stay consistent with the no-third-party-cloud
  principle — the tradeoff is reminders may not fire if the app/OS has fully killed the
  scheduler over a long period

## 5. Architecture

### 5.1 Devices and data ownership
- Each phone holds a full local SQLite database — usable fully offline
- One desktop app acts as the **admin/sync server** for a household or group
- No company-run cloud server in the free tier

### 5.2 Sync model (v1 — free tier)
- **Same-WiFi / LAN-only sync.** Desktop app runs a lightweight local server.
  Phones discover it automatically via mDNS/Bonjour (same mechanism as AirDrop/
  Chromecast/network printers) when on the same network.
- Sync triggers automatically when a phone joins the home network.
- New device/person onboarding: desktop displays a QR code containing a one-time
  pairing token (and, if E2EE is implemented, the group's symmetric key).
- Architecture: **client-server, not peer-to-peer.** Desktop is the source of truth;
  phones push/pull against an event log. This avoids needing true CRDT multi-master
  merge logic.
- Device identity: each phone gets a unique device ID at pairing time (via the QR
  flow), with **no separate password/PIN** — fits the trusted-household use case.
  Tradeoff: a lost/stolen paired phone retains standing access until removed by an
  admin. (Per-user PIN/passphrase can be reconsidered later if this proves insufficient.)

### 5.3 Sync model (v2 — paid hosted tier)
- Same server codebase as the desktop app, deployed to a VPS with a real domain + TLS
  instead of LAN/mDNS discovery.
- Reachability for the free tier's "remote access" variant (optional future add-on):
  Tailscale/WireGuard mesh recommended over manual port-forwarding or Dynamic DNS.
- This tier is what justifies a recurring subscription (real hosting cost);
  free tier remains a clean one-time purchase.

### 5.4 Data model (core entities)
- `Users` (with a `role` on group membership: `admin` | `member`), `Groups`,
  `Expenses` (includes `currency`), `ExpenseSplits` (equal/percentage/exact/shares),
  `Categories` (bundled defaults + user-created), `Payments/Settlements`
- `Installments` — child records of an Expense: amount, due date, paid/pending status
- `CategoryKeywords` — bundled, read-only keyword → category mapping (PT-BR + English)
  used for the static suggestion dictionary (not user-editable; ships with the app)
- `CategoryMemory` — learned mapping of normalized expense description → category,
  scoped per group; upserted whenever a user assigns/changes an expense's category;
  looked up by exact match only
- `SyncLog` — event-sourced ledger (entity, operation, device_id, logical timestamp)
  driving client-server sync

## 6. Security & Encryption

- **Transport encryption (mandatory, all tiers):** TLS for any network sync traffic —
  addresses man-in-the-middle risk.
- **At-rest encryption (recommended, all tiers):** SQLCipher for the local SQLite file,
  so a lost/stolen device doesn't expose plaintext data. Passphrase is
  **device-derived automatically**, stored in the platform's secure keystore/keychain
  (no user-facing passphrase to set or remember) — this is phase 6 work, not MVP.
- **End-to-end encryption (recommended for hosted/premium tier):**
  - One symmetric key per group, generated at group creation
  - Key distributed out-of-band via the existing QR invite flow (never touches the server)
  - Use an audited library (libsodium/NaCl), never custom crypto
  - Server stores/relays ciphertext only — cannot read data even when hosting it
  - Consequence: balance calculation, debt simplification, and BI/dashboard queries
    must run client-side on decrypted local data, not server-side
  - Needs an optional passphrase-based key backup/recovery flow (as WhatsApp/Signal do)
  - Free/LAN tier can rely on TLS + at-rest encryption alone, since the desktop is
    already a trusted device within the group

## 7. Desktop-Specific Features

- BI / analytics dashboard: spending by category, by person, by group, trends over time
  - Natural fit for desktop: fuller data copy, no mobile battery/screen constraints
  - Reads from the same local SQLite the sync server uses — no separate data pipeline
- Keep the sync-server module and the dashboard module decoupled in code, even though
  they ship in one app — dashboard issues should never affect sync reliability

## 8. Tech Stack

- **Language: TypeScript everywhere** — one language across mobile, backend, and
  dashboard. The four algorithms that matter (split math, debt simplification,
  categorization matching, installment rounding) live in one `shared/core` package
  imported unchanged by both the mobile app and the backend — one implementation,
  not two guarded by tests.
- **Sync/backup server (desktop):** Node.js + TypeScript (Express or Fastify);
  local SQLite (or Postgres for hosted tier) via **Drizzle** for schema/migrations
  — chosen over Prisma because Drizzle has no separate native query-engine binary,
  which avoids a packaging headache for the single-executable Windows installer
  (§8 desktop packaging) and keeps migrations plain-SQL, closer in spirit to
  WatermelonDB's hand-rolled mobile migrations; dependency management via **pnpm**
- **Mobile client:** **React Native (Expo)** — offline-first local SQLite via
  **Drizzle ORM + `expo-sqlite`**, the same ORM used by the backend (§8), so the
  whole stack shares one schema/query tool instead of two. Reactive UI updates
  use Drizzle's `useLiveQuery` hook. (Originally WatermelonDB; switched during
  Phase 2 scaffolding — see §13 decisions log for why.)
- **Target platforms (v1):** Android + iOS (Expo builds both from one codebase;
  iOS builds/signing require a Mac + Apple developer account, or Expo's cloud
  build service). Known trade-off vs. Flutter: RN has occasional native-module
  friction (a feature working cleanly on Android but needing extra native glue on
  iOS) — Expo's managed workflow covers most common cases (notifications, secure
  storage, SQLite) well enough that this is a smaller risk than it used to be, but
  not zero.
- **LAN sync discovery:** mDNS via `bonjour-service` / `multicast-dns` — mature,
  widely-used Node libraries for this exact "LAN service discovery" pattern
- **At-rest encryption:** SQLCipher via a Node binding, run against a real server
  process (not just mobile)
- **E2EE crypto:** `libsodium-wrappers` — the official libsodium binding, same
  audited library and trust level as Python's `pynacl`
- **BI dashboard:** a small React web app (Recharts or visx for charts) served by
  the same Node backend — same language as everything else, and "browser as UI"
  falls out naturally instead of being a deliberate accommodation
- **Desktop packaging:** bundled into a single self-contained Windows installer —
  Node 20+'s built-in single-executable-application feature (or `pkg`) packages the
  Node runtime and all dependencies into one executable, wrapped with Inno
  Setup/NSIS for a standard installer experience. End users install/run it like any
  other Windows app; no separate Node install. The app still launches a local
  server and opens the default browser as the UI — packaging changes only how it's
  distributed, not the browser-as-UI architecture.
- **Repo layout:** single monorepo, pnpm workspace (backend/desktop + mobile +
  dashboard + `shared/core` in one repo, shared CI)

## 9. UI/UX Guidelines

### 9.1 Overall design direction

- **Mobile (React Native / Expo):** modern "app feel," used with restraint.
  Glassmorphism (blur + translucency + soft shadow) applied selectively as chrome
  — nav bar, bottom sheets, modals, card backgrounds — never behind financial data
  itself: amounts, balances, and due dates always sit on a fully opaque,
  high-contrast surface. Soft shadows for elevation instead of hard borders. Dark
  mode is the primary design target (glass reads richer there); light mode is
  held to the same contrast bar, not an afterthought. Discipline against
  clutter: glass is reserved for at most 1–2 surface layers per screen, never
  stacked.
- **Desktop (React BI dashboard):** simpler and more serious than mobile — flat,
  high-contrast, data-dense BI-tool aesthetic, no glass/blur effects. Chart/table
  readability matters more here than visual flourish. Shares mobile's color
  palette and typography so it still feels like the same product, just without
  the translucency layer.
- Neumorphism (the sibling 2020-era trend) is explicitly out — worse
  accessibility than glassmorphism (low contrast by design) and hasn't aged well.

### 9.2 IP / copyright safety for the visual style

- Glassmorphism itself (blur + translucency + soft shadow) is a generic, widely
  adopted UI technique, not brand-exclusive IP — it ships in Windows 11
  (Mica/Acrylic), Android Material You, macOS, and countless unrelated
  third-party apps going back to ~2020. Using the aesthetic direction is not a
  copyright issue — same principle as §10: ideas/style trends aren't protected,
  only specific expression is.
- Do **not** reuse a vendor's proprietary assets — e.g. Apple's SF Symbols icon
  set, or any OS's exact system icons/wordmarks.
- Do **not** pixel-match a specific product's chrome — e.g. recreating iOS's
  Control Center or Samsung One UI's quick panel exactly (not just "a
  translucent panel," but its specific layout/proportions/motion) edges into
  trade dress territory.
- Never use a vendor's branded name for the effect in our own docs or marketing
  — e.g. Apple trademarked "Liquid Glass" as its design-language name (2025).
  Always describe ours generically as "glassmorphism" or "translucent UI."

### 9.3 BI dashboard color palette

Minimalist, Pacific-Northwest-evergreen-inspired palette: black and white carry
the UI, with green and brown as the only two meaningful accent hues — each
reserved for one specific job, never decorative, never mixed freely as
arbitrary "series colors." Colors were validated computationally for
colorblind-safety (CVD simulation) and contrast, not chosen by eye:

| Role | Light mode | Dark mode |
|---|---|---|
| Evergreen (green) | `#146b3a` | `#2fa866` |
| Bark/amber (brown) | `#b5701f` | `#c47a1f` |
| Primary ink | near-black (`#1a1a18`-ish) | white |
| Surface | warm off-white (`#faf8f4`-ish) | near-black |

Chart type is chosen by the data's job, not by taste:

- **Spending by category / by person / by group:** sorted horizontal bar chart,
  single evergreen-green sequential hue (light tint = smallest, deep forest =
  largest), with direct value labels — no legend needed. Avoid pie/donut
  charts: comparing bar length reads more clearly than comparing angles, and
  it's more minimal besides.
- **Balances / "who owes whom":** diverging horizontal bar centered on zero —
  green = credit (owed to you), brown = debit (you owe), gray neutral baseline
  at zero.
- **Trends over time:** a single green line for the overall total. If a
  category breakdown is ever needed on the same trend, highlight one category
  in green and gray out the rest (emphasis pattern) rather than adding more
  colors.
- **Installment status (paid/pending):** reuse the same two-hue logic — green =
  paid, brown = pending — no separate status color scale needed at this app's
  scale.

If a future chart genuinely needs more than 2–3 distinct series identities,
that's a signal to reach for small multiples or a table view, not to add more
hues to the brand palette.

## 10. Licensing & IP

- License: **MIT** (Apache 2.0 also acceptable if an explicit patent grant is wanted)
- Do not copy Splitwise's code, exact UI/visual design, icons, or marketing copy
- Functional similarity (splitting, categories, balances) is not a copyright issue —
  ideas/functionality aren't protected, only specific expression
- Debt-simplification algorithm is a well-known generic network-flow problem —
  implement independently, not adapted from Splitwise's code
- Do not use the name "Splitwise" or a confusingly similar name/logo — trademark risk,
  separate from copyright
- Register a distinct trademark for the app's own name/logo once serious about launch
- If still using a personal Splitwise Pro account for reference, don't scrape or
  reverse-engineer their app/API (ToS/contract issue, not copyright)

## 11. Monetization

- **Free tier:** full functionality, LAN-only sync, one-time purchase (or fully free) —
  "your data never leaves your home network"
- **Premium tier:** hosted sync server (recurring subscription, justified by real
  ongoing hosting cost) — "we host it, but architecturally cannot read your data" (E2EE)
- No ads — inconsistent with a finance app and a weak revenue model at expected scale;
  ad-free is also a market differentiator against Splitwise specifically

## 12. Phased Roadmap

1. Foundations — finalize mobile stack decision, repo setup, MIT license, CI
2. MVP offline app — local CRUD for expenses/groups/categories, no sync yet
3. Splitting & balances — split types, balance math, settle-up, debt simplification
4. Installments feature
5. LAN sync engine — desktop server, mDNS discovery, event-log push/pull, QR pairing
6. Security layer — TLS, at-rest encryption (SQLCipher), E2EE groundwork
7. Desktop BI dashboard
8. Polish & release — notifications, currency handling, testing, packaging
   (Node SEA/`pkg` + Inno Setup/NSIS for a single Windows installer)
9. Premium hosted tier — same server code, deployed with TLS + real domain,
   subscription billing, optional E2EE enforcement

## 13. Decisions Log

All decisions needed to start implementation have been made:

- [x] Language: **TypeScript everywhere** (React Native/Expo mobile + Node.js
  backend, one monorepo), chosen over Flutter+Python and Flutter+Dart for true
  code sharing of the core algorithms and more mature Node ecosystem for
  mDNS/SQLCipher/E2EE
- [x] Mobile framework: **React Native (Expo)**, offline SQLite via
  **Drizzle ORM + `expo-sqlite`** — changed from the original WatermelonDB
  choice during Phase 2 scaffolding: WatermelonDB's last commit was August
  2025 and it predates React Native's New Architecture (Fabric/TurboModules),
  which is the default on the RN version this app scaffolded on; community
  reports describe build failures and runtime instability running it there.
  `expo-sqlite` is Expo's own actively-maintained first-party module with
  confirmed New Architecture support, and Drizzle ships a `useLiveQuery` hook
  for reactive UI, recovering WatermelonDB's main advantage. Net effect: one
  ORM (Drizzle) across mobile and backend instead of two different schema
  tools — simpler than the original plan, not just a fallback
- [x] Backend ORM: **Drizzle** over Prisma — no native query-engine binary to
  bundle, which fits the single-executable Windows installer packaging goal;
  also now shared with the mobile client (see mobile framework decision above)
- [x] App name: **"A conta, Bill!"** (repo: `acontabill`)
- [x] E2EE: **deferred to the premium/hosted tier**; free/LAN tier uses TLS +
  at-rest encryption only
- [x] Multi-currency: **currency field in MVP schema**, per-currency balances kept
  separate (no conversion), UI/conversion logic deferred
- [x] Desktop app framework/UI toolkit: **Node.js (Express/Fastify) backend +
  React BI dashboard** (Recharts/visx), served by the same local server
- [x] Repo layout: **single monorepo, pnpm workspace**, with a shared `shared/core`
  package for split math, debt simplification, categorization matching, and
  installment rounding, imported unchanged by mobile and backend
- [x] License: **MIT**
- [x] Friends vs. groups: **groups only**, no separate friends concept
- [x] Installment rounding: **equal split, remainder on the last installment**,
  with manual override allowed
- [x] Target platforms: **Android + iOS**
- [x] Category keyword dictionary language: **PT-BR + English**
- [x] Category-memory matching strategy: **exact normalized match only**
- [x] Default categories: **ship a bundled default set**, user-extendable
- [x] Device identity for sync: **device ID from QR pairing, no password/PIN**
- [x] At-rest encryption passphrase: **device-derived, OS keystore** (phase 6 work)
- [x] Installment reminders: **local device notifications only**, no FCM/APNs (stretch)
- [x] Package/dependency management: **pnpm workspaces**
- [x] Group admin role: **elevated admin tied to the desktop/group owner** (can remove
  members, manage categories); **any member can edit/delete any expense**
- [x] Desktop distribution: **single self-contained Windows installer** — Node
  runtime + dependencies bundled via Node's single-executable-application feature
  (or `pkg`), wrapped with Inno Setup/NSIS; no separate Node/npm install for end
  users; UI is still the browser, opened automatically against the app's local
  server
- [x] UI aesthetic: **mobile uses glassmorphism selectively** (chrome only — nav,
  modals, cards — never behind financial data); **desktop dashboard stays
  flat/simple**, no glass effects; neumorphism rejected for both
- [x] BI dashboard color palette: **minimalist evergreen/Pacific-Northwest theme**
  — black + white primary, green + brown as the only two reserved accent hues
  (validated colorblind-safe), sequential/diverging chart encoding preferred over
  multi-color categorical charts

No open decisions remain blocking Phase 1. Anything not covered above (e.g. CI
provider, migrations tooling, exact folder structure) is an implementation detail to
settle during scaffolding, not a product decision.

# Tri-Cities Vote – Agent Guide (AGENTS.md)

This file gives working instructions for agents in this repo. Its scope is the entire repository.

## Goals Right Now
- Ship the 2025 General election guide (Primary was not completed).
- Operate with partial/incomplete candidate data until official sources publish.
- Keep changes minimal and focused on reliability and shipping.

## Quick Start
- Requirements: Node 18+, PostgreSQL URL (`DATABASE_URL`), and `pdftotext` (poppler) for Franklin imports.
- Env vars in `.env` (example):
  - `DATABASE_URL` – Prisma connection string
  - `SOCRATA_API_ID`, `SOCRATA_API_SECRET` – PDC API credentials (optional but recommended)
- Install and run:
  - `npm install`
  - `npx prisma generate`
  - `npm run dev`
- Useful local pages:
  - `/debug` – quick DB visibility
  - `/{year}` – year landing
  - `/{year}/guide/{region}` – regional guide
  - `/{year}/race/{slug}` – race page
  - `/{year}/candidate/{slug}` – candidate page

## Data Imports (operate safely)
- PDC contributions (fast, idempotent):
  - `npm run import:pdc:fast 2025`
- Voter pamphlet imports (require `DATABASE_URL` in env):
  - Benton County (API): `npx tsx scripts/import/pamphlet-2025.ts`
  - Franklin County (PDF scrape): `npx tsx scripts/import/pamphlet-franklin-2025.ts` (needs `pdftotext` on PATH)
  - Use `scripts/match-pamphlet-candidates.ts` for interactive name matching.
- 2025 candidate scaffolding from PDC:
  - `npx tsx scripts/import/pdc-candidates-2025.ts`
- Race ID discovery and validation:
  - `npx tsx scripts/fetch-race-ids.ts`
  - `npx tsx scripts/validate-race-ids.ts`

Notes:
- Scripts under `scripts/` are designed to be re-runnable and conservative. Prefer running those over ad‑hoc DB edits.
- Election results import is NOT implemented yet; see “Immediate Priorities”.

## Current State (2025)
- Next.js app and Prisma schema are in place; voter guide pages render from DB data.
- Primary 2025 wasn’t shipped. All focus is on the November General.
- `npm run prepare:2025:general` has created guides for Kennewick, Pasco, Richland, West Richland, and Benton County. West Richland currently has no candidates or races because filings aren’t in the DB yet.
- Compare view (`/{year}/compare/{slug}`) is live and uses the same “N/A” fallbacks as the main pages.
- We do not have full General candidate data yet (pamphlet/results not final). The UI now shows “N/A” fallbacks when statements, bios, photos, contact info, or fundraising are missing.
- Some docs still reference a “complete” primary import; treat those as stale unless you are mining historical context.

## Immediate Priorities to Ship General 2025
1. Keep 2025 general guides synced:
   - Run `npm run prepare:2025:general` after importing new candidates/offices so West Richland and Benton County stay current. Script is idempotent and will copy primary candidates into empty general races.
   - Backfill West Richland candidate/race data once filings land (currently empty guide).
2. Implement results import and wire `npm run import:results`:
   - Add `scripts/import/results.ts` that:
     - Fetches official results by election ID
     - Matches candidates to DB
     - Upserts `CandidateRace` with `voteCount`/`votePercent`, marks winners, and handles Richland term rules
     - Is idempotent and logs summaries
3. Continue hardening and filling content:
   - Flesh out placeholder copy (“N/A”) with real statements/photos/contact info as soon as pamphlet data arrives.
   - After each pamphlet run (`pamphlet-2025` + Franklin PDF importer) follow with `scripts/match-pamphlet-candidates.ts` to extend alias coverage.
4. Keep weekly PDC updates running:
   - `npm run import:pdc:fast 2025` (automate via cron/CI if available).
5. Build out outstanding scripts/checks as we move toward launch:
   - `scripts/import/results.ts` (see above)
   - Any `scripts/check-*` updates needed for newly split regions (West Richland vs. Richland).

## Code Organization
- Frontend (Next.js App Router): `app/`
  - `/{year}` landing, `guide`, `race`, `candidate` routes implemented.
- Data access: `lib/`
  - `lib/queries.ts` Prisma queries (server components)
  - `lib/wa-state/*` Socrata/PDC + pamphlet helpers
  - `lib/calculateFundraising.ts` aggregates contributions per candidate
- Schema/migrations: `prisma/`
- Import/maintenance scripts: `scripts/`
- Legacy Gatsby (reference only): `legacy/`

## Conventions & Guardrails
- Keep schema stable unless necessary. If you must change it, add a Prisma migration and update queries/scripts.
- Idempotent scripts: prefer upsert/batch patterns and safe deletes-by-id before insert when needed.
- Slugs: use lowercase, `-` separators; match existing helpers (`slugify`, `unslugify`).
- Office/region mapping: reuse existing helpers and mapping logic (avoid ad‑hoc titles that break joins).
- Don’t modify `legacy/` except for reference; modern app reads from DB.
- Images: store under `public/images/candidates/{year}`; reference via `/images/...` paths in DB.
- Keep docs in sync when you add/rename scripts (update `README.md` + this file).

## Missing/Outdated Pieces (be careful)
- `scripts/import/results.ts` is missing; implement as part of Immediate Priorities.
- `prisma/seed.ts` targets an older schema and should not be used. Avoid running it unless it’s updated.
- `PDC_DISPLAY_ISSUES.md` reflects older import-field assumptions; current import uses `amount` from PDC. Validate before acting.
- `tsconfig.json` excludes `lib/**/*` from main typecheck; queries compile at runtime, but edits there won’t be type-checked by Next build. Consider enabling for local safety, but don’t widen scope without intent.

## Partial/Missing Data Behavior
- The UI must render when any of the following are missing:
  - Candidate `image`, `statement`, `bio`, endorsements, or contributions
- `calculateFundraising()` returns `null` for no contributions; components already handle `null`.
- Prefer showing clear “Awaiting data” copy rather than hiding candidates.

## Validation & Debugging
- Open `/debug` to list guides/years.
- `npx prisma studio` for DB inspection.
- Scripts:
  - `scripts/check-*` (offices, duplicates, mismatches)
  - `scripts/validate-race-ids.ts`

## CI/Operational Notes
- If adding CI, include: install, `prisma generate`, typecheck/lint, and optionally a nightly/weekly `import:pdc:fast 2025` job.
- Never commit secrets. Use environment variables for DB/API creds.

## When You Touch Files
- Keep changes minimal and consistent with current style.
- Update this AGENTS.md if you change workflows or add key scripts.
- If you introduce a new import path or mapping, centralize it and document it here.

# Tri-Cities Vote – Agent Guide (AGENTS.md)

This file gives working instructions for agents in this repo. Its scope is the entire repository.

## Goals Right Now
- Keep the 2025 General election guide accurate as official data rolls in.
- Operate with partial/incomplete candidate data until counties publish certified statements or results.
- Keep changes minimal and focused on reliability and shipping.

## Quick Start
- Requirements: Node 18+, PostgreSQL URL (`DATABASE_URL`), and `pdftotext` (poppler) for Franklin imports.
- Env vars in `.env` (example):
  - `DATABASE_URL` – Prisma connection string
  - `SOCRATA_API_ID`, `SOCRATA_API_SECRET` – PDC API credentials (optional but recommended)
  - `JWT_SECRET` – JWT secret for wiki authentication
  - `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` – Email service for wiki notifications
  - `NEXT_PUBLIC_BASE_URL` – Base URL for magic link emails
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
  - `/login` – wiki system authentication
  - `/moderate` – moderator review interface (requires MODERATOR/ADMIN role)
  - `/edits` – public edit audit trail
  - `/admin/wiki` – moderator dashboard (pending edits, contributor stats)
  - `/admin/engagements` – engagement manager for questionnaires/forums (MODERATOR/ADMIN)
  - `/admin/endorsements` – endorsement manager for URLs and file uploads (MODERATOR/ADMIN)

- Reset/import workflow (run in this order when refreshing data):
  1. **Purge stale primary/generic data** (optional when already clean):
     - `npx tsx scripts/data/cleanup-2025-offices.ts`
  2. **PDC candidates + offices** (recreates seats listed in `scripts/import/2025-seats.ts`):
     - `npx tsx scripts/import/pdc-candidates-2025.ts`
     - `npm run import:pdc:fast 2025`
  3. **Core race enforcement** (ensures every tracked seat exists and only general candidates remain):
     - `npx tsx scripts/import/ensure-2025-core-races.ts`
  4. **Guide linking** (reattach races to guides):
     - `npm run prepare:2025:general`
  5. **Pamphlet data** (requires `pdftotext`):
     - Benton/West Richland etc.: `npx tsx scripts/import/pamphlet-2025.ts`
     - Pasco/Franklin PDF: `npx tsx scripts/import/pamphlet-franklin-2025.ts`
     - Follow with `scripts/match-pamphlet-candidates.ts 2025` when new names appear.

- Other scripts:
  - `npx tsx scripts/fetch-race-ids.ts` / `scripts/validate-race-ids.ts` for troubleshooting county IDs.
  - `scripts/check-*` utilities to spot duplicates or missing offices.
  - `npx tsx scripts/add-announcements.ts` – populate League of Women Voters events in guides.
  - Engagement/questionnaire imports live under `scripts/import/` (`npm run import:tcrc`, `import:tcrc:videos`, `import:ballotpedia`, `import:wrcg`). Each script upserts into `Engagement` and `CandidateEngagement`; run the `:load` companion command to write DB changes after reviewing CSV output.

Notes:
- Scripts under `scripts/` are designed to be re-runnable and conservative. Prefer running those over ad‑hoc DB edits.
- Election results import is NOT implemented yet; see “Immediate Priorities”.

- Next.js app and Prisma schema are in place; voter guide pages render from DB data.
- Primary 2025 data is archived; only the November general roster is present in Prisma (26 races, every seat named per the standards below).
- The `/` landing page mirrors the legacy intro, auto-selects the latest election, and lists every general race via `RaceCard` so DB changes surface immediately.
- PDC importers normalize offices to the canonical seat format (`{City} City Council {Ward/Position/District}`, `{City} School Board {District/Position}`, `Port of {Locale} Commissioner District {n}`) and only ingest candidates defined in `scripts/import/2025-seats.ts`.
- West Richland, Kennewick, Pasco, Richland, and the two ports all have current general lineups; unopposed seats show a single candidate.
- Compare view (`/{year}/compare/{slug}`) is live and uses the same "N/A" fallbacks as the main pages.
- General statements/photos/contact are still arriving; pamphlet scripts are re-runnable and fill gaps as counties publish updates.
- Some older docs still reference a "complete" primary import—treat those as historical context only.
- **Wiki system is live**: Community-driven editing with email authentication, moderator review, and public audit trail. Supports editing candidate info, race descriptions, and regional announcements.
- **Engagement manager**: Structured tracking for questionnaires/forums lives in new `Engagement` + `CandidateEngagement` tables. Moderators manage these at `/admin/engagements` (API: `POST /api/admin/engagements`, `PATCH/DELETE /api/admin/engagements/:id`). Import scripts should upsert against those tables instead of the legacy markdown field.
- **Endorsement manager**: Moderators can add URL-based endorsements or upload source files at `/admin/endorsements` (API: `GET/POST /api/admin/endorsements`, `DELETE /api/admin/endorsements/:id`). File uploads land in `public/uploads/endorsements/{year}`. Community users can now suggest links or upload supporting letters from candidate pages; suggestions arrive as `ENDORSEMENT` edits for moderation (uploads are temporarily stored under `/uploads/endorsements/pending/{year}` and promoted on approval).
- **Announcements system**: Markdown-based announcements for races and regional guides with multi-column layout. League of Women Voters candidate events are populated for all 2025 city guides.

## Immediate Priorities to Ship General 2025
1. **Maintain the roster**: When new filings or corrections appear, rerun the reset/import pipeline (cleanup → PDC import → core races → prepare → pamphlets). Guides will pick up the updates automatically.
2. **Implement results import** (`scripts/import/results.ts` + `npm run import:results`) to pull official vote totals, mark winners, and handle Richland’s special term rules once canvass data is released.
3. **Continue content backfill**: As counties post revised pamphlets or candidate-provided assets, rerun the pamphlet scripts and `scripts/match-pamphlet-candidates.ts 2025` to extend alias coverage and fill missing statements/photos.
4. **Keep finance up to date**: run `npm run import:pdc:fast 2025` on cadence (weekly or after major filing deadlines).
5. **Expand checks**: extend `scripts/check-*` utilities as needed (e.g., to validate the shared seat definitions or highlight unassigned candidates).

## Code Organization
- Frontend (Next.js App Router): `app/`
  - `/{year}` landing, `guide`, `race`, `candidate` routes implemented.
  - `/login`, `/moderate`, `/edits` – wiki system pages
  - `/api/auth/*` – authentication endpoints
  - `/api/edits/*` – edit management endpoints
- Data access: `lib/`
  - `lib/queries.ts` Prisma queries (server components)
  - `lib/wa-state/*` Socrata/PDC + pamphlet helpers
  - `lib/calculateFundraising.ts` aggregates contributions per candidate
  - `lib/auth/*` – wiki authentication and email services
  - `lib/wiki/*` – wiki field definitions and edit mode management
- Components: `components/`
  - `components/wiki/*` – editable fields, announcements, moderation UI
  - `components/examples/*` – usage examples and demos
- Schema/migrations: `prisma/`
- Import/maintenance scripts: `scripts/`
- Legacy Gatsby (reference only): `legacy/`

## Conventions & Guardrails
- Keep schema stable unless necessary. If you must change it, add a Prisma migration and update queries/scripts.
- Idempotent scripts: prefer upsert/batch patterns and safe deletes-by-id before insert when needed.
- Slugs: use lowercase, `-` separators; match existing helpers (`slugify`, `unslugify`).
- Engagement data: use the structured `Engagement` and `CandidateEngagement` tables. Let the admin UI or import scripts generate slugs; avoid editing the legacy `candidate.engagement` markdown unless backfilling history.
- Office/region mapping: reuse existing helpers and mapping logic (avoid ad‑hoc titles that break joins).
- Don’t modify `legacy/` except for reference; modern app reads from DB.
- Images: store under `public/images/candidates/{year}`; reference via `/images/...` paths in DB.
- Keep docs in sync when you add/rename scripts (update `README.md` + this file).

## Missing/Outdated Pieces (be careful)
- `scripts/import/results.ts` is missing; implement as part of Immediate Priorities.
- `prisma/seed.ts` targets an older schema and should not be used. Avoid running it unless it’s updated.
- `PDC_DISPLAY_ISSUES.md` reflects older import-field assumptions; current import uses `amount` from PDC. Validate before acting.
- `tsconfig.json` excludes `lib/**/*` from main typecheck; queries compile at runtime, but edits there won’t be type-checked by Next build. Consider enabling for local safety, but don’t widen scope without intent.
- Legacy imagery used on the new landing page now lives under `public/images`; keep additions there square to avoid layout regressions.
- If you need to reset the 2025 municipal dataset, run `npx tsx scripts/data/cleanup-2025-offices.ts` before kicking off the imports above – it removes primary races, generic council/school offices, and old mayor data.

## Naming Standards
- City council seats: `{City} City Council {Ward/District/Position} {Number}` (e.g., `Kennewick City Council Ward 1`, `Pasco City Council District 6`).
- School board seats: `{City} School Board {District/Position} {Number}` or `{City} School Board At-Large Position {Number}`.
- Port seats: `Port of {Benton|Kennewick} Commissioner District {Number}`.

## Wiki System & Community Editing
- **Authentication**: Passwordless email magic links (15-min expiry)
- **User roles**: COMMUNITY (default), CANDIDATE, MODERATOR, ADMIN
- **Trust system**: Progressive edit limits based on approval history (1 → 3 → 10 pending edits)
- **Editable entities**: CANDIDATE, RACE, OFFICE, GUIDE
- **Editable fields**: See `lib/wiki/fields.ts` for complete list
- **Moderation**: All edits require moderator approval before going live
- **Data priority**: Wiki overrides (`*Wiki` fields) take precedence over imported data
- **Email notifications**: Mailgun-based system for login links, edit status, and moderator alerts
- **Audit trail**: Public edit history at `/edits` with rationales and moderator notes
- **Admin console**: `/admin/wiki` (moderator/admin only) exposes dashboard metrics, pending queue, moderation history, and contributor management.
- **Contributor dashboards**: Link to `/edits/user/{publicId}` (and `/accepted`, `/pending`, `/declined` variants) or `/edits/candidate/{slug}` for transparency; IDs are the six-character `publicId` assigned to each user.
- **Bootstrap admin**: run `npx tsx scripts/wiki/bootstrap-admin.ts` to promote `guide@tricitiesvote.com` (override email with an argument).

## Announcements System
- **Markdown support**: Rich text with special multi-column layout for top-level bullets
- **Display**: Responsive grid layout, cards for each top-level item, sub-bullets grouped
- **Editable via wiki**: Both race and guide announcements can be community-edited
- **Current content**: League of Women Voters candidate events pre-populated for 2025 guides
- **Usage**: Use `<EditableField>` with `<AnnouncementDisplay>` for markdown rendering

## Partial/Missing Data Behavior
- The UI must render when any of the following are missing:
  - Candidate `image`, `statement`, `bio`, endorsements, or contributions
  - Race or guide `announcements`
- `calculateFundraising()` returns `null` for no contributions; components already handle `null`.
- Wiki system prioritizes wiki overrides (`*Wiki` fields) over original data when present.
- Prefer showing clear "Awaiting data" copy rather than hiding candidates.
- Announcements display as empty when no content is provided.

## Validation & Debugging
- Open `/debug` to list guides/years.
- `npx prisma studio` for DB inspection.
- Scripts:
  - `scripts/check-*` (offices, duplicates, mismatches)
  - `scripts/validate-race-ids.ts`
  - `scripts/wiki/backfill-public-ids.ts` to populate `publicId` for legacy accounts after the migration.

## CI/Operational Notes
- If adding CI, include: install, `prisma generate`, typecheck/lint, and optionally a nightly/weekly `import:pdc:fast 2025` job.
- Never commit secrets. Use environment variables for DB/API creds.

## When You Touch Files
- Keep changes minimal and consistent with current style.
- Update this AGENTS.md if you change workflows or add key scripts.
- If you introduce a new import path or mapping, centralize it and document it here.

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
  - `NEXT_PUBLIC_SHOW_UNCONTESTED` – set to `true` to include uncontested races in list views (default hides them)
  - `NEXT_PUBLIC_HIDE_PARTIAL_TCV_RESPONSES` – leave unset (default `true`) to hide Tri-Cities Vote Q&A answers until every candidate in a contested race responds; set to `false` to always display the answers
  - `NEXT_PUBLIC_TCV_PARTIAL_HIDE_EXCEPTIONS` – comma-separated list of race identifiers (slug, race ID, or exact title) that bypass the partial-response hiding rule; defaults include `richland-city-council-position-3` for the Holten/Walko contest
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
     - ✅ Make sure **Benton County City of West Richland Mayor** is present in `2025-seats.ts` before running; this keeps the mayoral contest in sync with Vote411, WRCG, and PDC imports.
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
  - `npm run import:questionnaire <city-council|school-board|all>` loads 2025 questionnaire CSVs (rerunnable; writes unmatched names to `scripts/import/unmatched-*.txt`).
  - `npx tsx scripts/add-announcements.ts` – populate League of Women Voters events in guides.
  - `./node_modules/.bin/ts-node scripts/data/update-office-titles.ts` – sync abbreviated office names (`Pos`, port cleanup) after title changes.
  - `./node_modules/.bin/ts-node scripts/check-contribution-flags.ts [year]` – sanity-check cash vs in-kind totals from PDC imports.
  - `./node_modules/.bin/ts-node scripts/import/pdc-committees.ts` – load measure committee contribution history (e.g., Pro/Con charter campaigns).
  - Engagement/questionnaire imports live under `scripts/import/` (`npm run import:tcrc`, `import:tcrc:videos`, `import:ballotpedia`, `import:wrcg`, `import:lowv`). Each script produces both a participation CSV **and** a detailed responses CSV, then upserts into `Engagement` + `CandidateEngagement`; run the `:load` companion command to write DB changes after reviewing CSV output.
  - Vote411 scraper (`import:lowv`) calls the Vote411 REST API directly (client credentials are embedded in the public widget). No browser automation is required; ensure outbound HTTPS is available.

Notes:
- Scripts under `scripts/` are designed to be re-runnable and conservative. Prefer running those over ad‑hoc DB edits.
- Election results import is NOT implemented yet; see “Immediate Priorities”.

- Next.js app and Prisma schema are in place; voter guide pages render from DB data.
- Primary 2025 data is archived; only the November general roster is present in Prisma (26 races, every seat named per the standards below).
- The `/` landing page mirrors the legacy intro, auto-selects the latest election, and lists every general race via `RaceCard` so DB changes surface immediately. Uncontested races are hidden by default; flip `NEXT_PUBLIC_SHOW_UNCONTESTED=true` locally if you need to inspect them in list views.
- PDC importers rely on the canonical seat format noted above (`Ward`, `Pos`, etc.) and only ingest candidates defined in `scripts/import/2025-seats.ts`.
- West Richland (including the **Mayor** contest), Kennewick, Pasco, Richland, and the two ports all have current general lineups; unopposed seats show a single candidate.
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
- City council seats: `{City} City Council {Ward/District/Pos} {Number}` (e.g., `Kennewick City Council Ward 1`, `Richland City Council Pos 3`).
- School board seats: `{City} School Board {District/Pos} {Number}` (e.g., `Pasco School Board Pos 5`).
- Port seats: `Port of {Benton|Kennewick|Pasco} Commissioner` (district numbers noted in body copy if needed).

## Ballot Measures
- Set the race `OfficeType` to `BALLOT_MEASURE` in Prisma (handled automatically once the seat definition uses that enum).
- Store the neutral overview in the race `intro` field (Markdown supported) and use the `body` field for structured details—e.g., `### Pro` and `### Con` sections, key dates, fiscal notes.
- On the compare page we hide candidate cards, so volunteers should ensure the `intro/body` copy contains everything voters need.
- When importing pamphlet text, keep the short summary concise (the compare cards truncate after ~220 characters).

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
- Tri-Cities Vote questionnaires stay hidden for contested races until every visible candidate responds (unless `NEXT_PUBLIC_HIDE_PARTIAL_TCV_RESPONSES=false` or the race slug/ID/title lives in `NEXT_PUBLIC_TCV_PARTIAL_HIDE_EXCEPTIONS`). A banner reminds readers which candidates are still outstanding and links to their email when available unless the bypass applies.

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

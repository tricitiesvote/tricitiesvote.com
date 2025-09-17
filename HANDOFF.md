# Handoff – General Election 2025 Focus

## Current Status
- The app now defaults to **2025 General** data everywhere (`lib/queries.ts` filters by `ElectionType.GENERAL`).
- General guides currently exist for Kennewick, Pasco, Richland, West Richland, and Benton County.
- UI hardening is complete: every guide/race/candidate page (including the compare view) shows "N/A" placeholders when statements, bios, contact info, photos, or fundraising are missing.
- `/{year}/compare/{slug}` route is implemented and stable.
- Database connection lives in `.env` (Railway Postgres). `npm run prepare:2025:general` was run against that DB this session.

## Data Snapshot (Feb 2025)
- `npm run prepare:2025:general`:
  - Created the West Richland region/guide and re-homed all `West Richland …` offices.
  - Ensured Benton County guide exists so the Port of Benton race has a home.
  - Seeded 20 general races by copying primary candidates where no general records existed.
- West Richland guide currently has **0 races/candidates** (no filings imported yet). All other city guides show the copied rosters from the primary.
- Candidate content is still mostly placeholder—expect missing statements/photos/contact info until pamphlet data lands.

## Outstanding Work
1. **Populate West Richland general data** once filings arrive. After any new imports, re-run `npm run prepare:2025:general` to copy candidates into empty general races and keep guide links aligned.
2. **Results ingest** – `scripts/import/results.ts` is still a TODO; hook it up to `npm run import:results` when ready.
3. **Pamphlet + media updates** – rerun `npx tsx scripts/import/pamphlet-2025.ts` (plus `scripts/match-pamphlet-candidates.ts`) once the general pamphlet is published, then remove the “N/A” placeholders manually where data is now available.
4. **Weekly finance refresh** – keep `npm run import:pdc:fast 2025` on cadence.
5. **Region-specific checks** – if you rely on any of the `scripts/check-*` utilities, confirm they handle the new West Richland region (some of them still assume Richland).

## How to Continue Safely
- To inspect current general data from the CLI, you can run (with network access):
  ```bash
  npx ts-node --project tsconfig.scripts.json <<'TS'
  import { getGuidesForYear } from './lib/queries'
  getGuidesForYear(2025).then(guides => {
    console.log(guides.map(g => ({ region: g.region.name, races: g.Race.length })))
  })
  TS
  ```
- Run `npm run prepare:2025:general` after any candidate/office import. It is idempotent and reassigns West Richland offices automatically.
- When editing queries, remember the app only displays general data now; if you need primary history, query Prisma directly instead of using the helpers.

## Recent Changes to Note
- `AGENTS.md` updated to reflect the general-election focus and highlight the new script/workflow.
- `lib/utils.ts` adds Benton County to the municipal region selector so the Port guide is accessible.
- All slug handling now flows through `slugify`/`unslugify`, so avoid manual `toLowerCase().replace(...)` patterns going forward.
- Styles now include `.compare-page`, `.candidate-empty`, and `.placeholder` rules; reuse them for any new UI that needs placeholder states.

Reach out (or leave notes here) if you add new scripts or change workflows so this handoff stays accurate.

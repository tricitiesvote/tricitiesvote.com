# Handoff – General Election 2025 Focus

## Current Status
- The app now defaults to **2025 General** data everywhere (`lib/queries.ts` filters by `ElectionType.GENERAL`).
- General guides currently exist for Kennewick, Pasco, Richland, West Richland, and Benton County.
- UI hardening is complete: every guide/race/candidate page (including the compare view) shows "N/A" placeholders when statements, bios, contact info, photos, or fundraising are missing.
- `/{year}/compare/{slug}` route is implemented and stable.
- The root `/` page now mirrors the legacy look-and-feel: it auto-selects the latest election, reuses the “How to use this guide” explainer, and renders every general race using the shared `RaceCard` component.
- Database connection lives in `.env` (Railway Postgres). `npm run prepare:2025:general` was run against that DB this session.
- New script `scripts/import/ensure-2025-core-races.ts` seeds/aligns the 2025 city council, school board, and port races so the landing overview always has the key contests.

## Data Snapshot (Sep 2025)
- `npm run prepare:2025:general`:
  - Created the West Richland region/guide and re-homed all `West Richland …` offices.
  - Ensured Benton County guide exists so the Port of Benton race has a home.
  - Seeded 20 general races by copying primary candidates where no general records existed.
- Added Franklin PDF importer (`scripts/import/pamphlet-franklin-2025.ts`) to ingest Pasco council/school content.
- Legacy homepage artwork copied to `public/images` for the new landing layout (`compare-two.jpg`, `compare.png`, `comment.jpg`).
- All municipal seats now use the normalized titles (City Council and School Board formats, plus ports). Primary races were removed and only November general contests remain in the guides.
- Shared seat definitions (`scripts/import/2025-seats.ts`) drive both the PDC import and the core-race script, guaranteeing consistent office naming and candidate assignment across Kennewick, Pasco, Richland, West Richland, and the ports.
- West Richland guide currently has **0 races/candidates** (no filings imported yet). All other city guides show the copied rosters from the primary.
- Candidate content is still mostly placeholder—expect missing statements/photos/contact info until pamphlet data lands.

## Outstanding Work (next in line)
1. **Restore DB connectivity** – the importer scripts expect `DATABASE_URL` in the local env. Make sure the `.env` file (Railway connection) is present before re-running any data pulls.
2. **Populate West Richland general data** once filings arrive. After any new imports, re-run `npm run prepare:2025:general` to copy candidates into empty general races and keep guide links aligned.
3. **Pamphlet updates** – once `DATABASE_URL` is set:
   - Run `npx tsx scripts/import/pamphlet-2025.ts` (Benton API) and `npx tsx scripts/import/pamphlet-franklin-2025.ts` (Franklin PDF via `pdftotext`)
   - Follow with `npx tsx scripts/match-pamphlet-candidates.ts 2025` to reconcile aliases
   - Finish with `npm run prepare:2025:general` so guides pick up the new statements
4. **Images/media** – Franklin PDF importer only covers text/contact info. Coordinate with the photo workflow to drop assets under `public/images/candidates/2025` and update candidate `image` fields manually.
5. **Landing page QA** – whenever guide data changes, spot-check `/` to ensure the candidate overview still renders cleanly (it reads directly from `getGuidesForYear`).
6. **Run the Franklin PDF importer** (`npx tsx scripts/import/pamphlet-franklin-2025.ts`) after each new pamphlet release; it now fills Pasco council/school statements and contact info.
7. **Keep core race script handy** – rerun `npx tsx scripts/import/ensure-2025-core-races.ts` (definitions in `scripts/import/2025-seats.ts`) if new office/candidate data arrives so the general guides stay populated.
8. **Results ingest** – `scripts/import/results.ts` is still a TODO; hook it up to `npm run import:results` when ready.
9. **Weekly finance refresh** – keep `npm run import:pdc:fast 2025` on cadence.
10. **Region-specific checks** – if you rely on any of the `scripts/check-*` utilities, confirm they handle the new West Richland region (some of them still assume Richland).

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
- Use `npx tsx scripts/import/pamphlet-2025.ts` (Benton API) and `npx tsx scripts/import/pamphlet-franklin-2025.ts` (Franklin PDF, requires `pdftotext`) before re-running the prepare script; both depend on `DATABASE_URL` being set.
- When editing queries, remember the app only displays general data now; if you need primary history, query Prisma directly instead of using the helpers.

## Recent Changes to Note
- `AGENTS.md` updated to reflect the general-election focus, the refreshed landing layout, and highlight the new script/workflow.
- `lib/utils.ts` adds Benton County to the municipal region selector so the Port guide is accessible.
- All slug handling now flows through `slugify`/`unslugify`, so avoid manual `toLowerCase().replace(...)` patterns going forward.
- Styles now include `.compare-page`, `.candidate-empty`, and `.placeholder` rules; reuse them for any new UI that needs placeholder states.

Reach out (or leave notes here) if you add new scripts or change workflows so this handoff stays accurate.

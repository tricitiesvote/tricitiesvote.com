# Tri-Cities Vote Architecture

This document describes the current architecture of the Tri-Cities Vote codebase, focusing on the application structure, database schema, and the data-maintenance scripts that keep donor and letter-to-the-editor data fresh during the 2025 general cycle.

## High-Level Overview

- **Framework**: Next.js 14 (App Router) with React Server Components for data-heavy pages and client components for interactive flows (authentication, wiki editing, moderation).
- **Runtime**: Node.js 18+. Pages default to server rendering with selective ISR (`export const revalidate = 3600`) on guide routes to keep content reasonably fresh while avoiding constant rebuilds.
- **Data Source**: PostgreSQL accessed through Prisma. All pages and API routes receive data exclusively through Prisma queries or mutations.
- **Auth & Wiki System**: Email-based magic links (Mailgun) plus a moderation workflow that stores pending edits; wiki overrides win over imported data at render time.
- **Data Imports**: TypeScript scripts under `scripts/` orchestrate ingestion from public data sources (PDC, local news) and write into the shared Prisma schema.

The production deployment assumed by the repository is a single Next.js app talking directly to the database. No separate API layer or worker queue exists—scripts are executed manually as needed.

## Application Architecture

### App Router Layout (`app/`)

- **Root layout** (`app/layout.tsx`): wraps all pages with `AuthProvider` and `EditModeProvider`, enabling authentication state and wiki editing toggles globally. A `ServiceWorkerCleanup` component removes stale service worker registrations from the legacy Gatsby build.
- **Landing & year routes**:
  - `app/page.tsx` renders the latest election’s summary using cached Prisma queries (`getGuidesForYearCached`).
  - `app/[year]/page.tsx` shows a per-year overview and links to regional guides (`GuideSelector`).
  - `app/[year]/guide/[region]/page.tsx` renders a region’s races via `RaceCard`, ordering them with `orderRaces`.
- **Entity views**:
  - `app/[year]/race/[slug]/page.tsx`, `app/[year]/candidate/[slug]/page.tsx`, and `app/[year]/compare/[slug]/page.tsx` load single-entity detail views using helpers in `lib/queries.ts`.
  - Components prefer wiki overrides (`preferWikiString`) over imported text, so approved edits appear immediately without altering underlying imported data.
- **Operational interfaces**:
  - `/login` triggers the magic-link flow.
  - `/moderate` (client component) lists pending edits and lets moderators approve or reject with optional notes.
  - `/edits` tree exposes audit history for the public, user-centric dashboards, and candidate-specific edit feeds.
  - `/admin/wiki` provides aggregate moderation metrics and contributor management; `/admin/engagements` hosts the Engagement Manager for creating/editing `Engagement` and `CandidateEngagement` records.
  - `/debug` dumps a raw DB view for quick sanity checks during manual maintenance.
- **Redirects** under `app/(redirects)` keep legacy URLs alive.

### API Surface (`app/api/*`)

Next.js route handlers act as the server-side API layer:

- **Auth** (`app/api/auth/*`):
  - `login`: rate-limited endpoint that generates a JWT-like token, records it in `LoginToken`, and dispatches an email via Mailgun.
  - `verify`: exchanges the token for a user session cookie.
  - `me`: returns the currently authenticated user (used by `AuthProvider`).
  - `logout`: revokes the session using a CSRF-protected POST.
- **Wiki moderation**:
  - `app/api/edits` supports listing, creating, and updating edits.
  - `app/api/edits/pending` feeds the moderation queue.
  - `app/api/edits/[id]`: moderators update status and optionally add notes (Mailgun notification sent downstream).
  - `app/api/edits/history/[entityType]/[entityId]`: public audit trail.
- **Admin utilities**:
  - `/api/admin/wiki/overview`: dashboard metrics.
  - `/api/admin/wiki/users`: list/manage contributors.
  - `/api/admin/engagements` (GET/POST) and `/api/admin/engagements/[id]` (PATCH/DELETE): moderator-only endpoints for managing engagement metadata and per-candidate participation.
  - `/api/admin/endorsements` (GET/POST) and `/api/admin/endorsements/[id]` (DELETE): create URL/file endorsements, store uploads under `public/uploads/endorsements/{year}`, and list existing records with candidate context.
  - `/api/endorsement-suggestions/upload`: authenticated community endpoint that stages uploaded letters under `/uploads/endorsements/pending/{year}` for moderator approval.
  - `/api/users/[id]/role`: privileged endpoint for role promotion/demotion (used by bootstrap scripts).
- **Bulk operations**:
  - `/api/candidates/bulk`: supports multi-field updates, primarily used by internal tools to sync data safely.

All API routes pull from `lib/db.ts` for a shared PrismaClient instance and rely on helper modules in `lib/wiki` for authorization checks and field-level validation.

### Component System (`components/`)

- **Race & candidate presentation** (`components/race`, `components/candidate`):
  - `RaceCard` renders each race summary including fundraising snapshots derived from `calculateFundraising.ts`.
  - `CandidateMini` and related components show per-candidate contact, endorsements (links or uploaded files), fundraising, and structured engagement participation (via `CandidateEngagementList`), hiding candidates flagged with `hide`. Edit mode surfaces call-to-action buttons so contributors can suggest links or upload supporting letters.
  - Compare views reuse the same data but pivot layout for side-by-side evaluation.
- **Wiki UI** (`components/wiki/*`):
  - `EditableField` wrappers surface inline edit controls when edit mode is enabled and the user is authenticated.
  - `DiffView` performs a simple LCS diff for moderation.
  - `EngagementManager` (admin-only) wraps the `/api/admin/engagements` endpoints, providing a form to create/update events and mark candidate participation.
  - `EndorsementManager` (admin-only) wraps the `/api/admin/endorsements` endpoints, offering separate flows for URL-based entries and file uploads.
  - Announcement editors/renderers support Markdown with the bespoke multi-column layout used on guides.
- **UI primitives** live in `components/ui`, mostly shadcn patterns for cards, badges, buttons, etc.
- **Home & shared sections** (`components/home`, `components/GuideSelector`, `components/ContactInline`) compose the landing experience.

Client components typically fetch data through API routes while server components call `lib/queries.ts` directly.

## Database Schema

The schema (see `prisma/schema.prisma`) centers on election entities and the wiki/audit system.

### Core Election Models

- **Region**: Named service areas (cities, counties). One-to-many relationship with `Guide` and `Office`.
- **Office**: Canonical seats (e.g., `Kennewick City Council Ward 1`). Connected to a `Region` and has `candidates` and `races`. Wiki override fields (`titleWiki`, `jobTitleWiki`, `descriptionWiki`) allow curated copy without mutating base imports.
- **Race**: Specific contests per year and office. Stores long-form intro/body copy plus announcements, with wiki overrides.
- **Candidate**: Individuals running in a given election year. Linked to a single `Office` and many `Race` entries through the `CandidateRace` join model. Contains optional contact info, `donors` summary text, `lettersYes`/`lettersNo`, and wiki overrides for community-managed fields.
- **CandidateRace**: Join table capturing per-race metadata (incumbent flag, vote totals when available, short-term seat markers).
- **Guide**: Published election guides per region and year, connected to multiple `Race` records.

### Supporting Data

- **Contribution**: Individual donor records imported from the Public Disclosure Commission (PDC). Each belongs to a `Candidate` with donor identity details, amount, date, and `cashOrInKind` classification.
- **Endorsement**: Captures endorsements and opposition statements; `type` distinguishes letters vs. organizational/social endorsements. Records may include an external URL, an uploaded file (`filePath`), optional display label, and moderator notes. Used by the letters-to-the-editor import path and admin uploads.
- **EnforcementCase**: PDC enforcement data. Optional `candidateId` and `matchConfidence` track fuzzy matches between cases and candidates.
- **Engagement / CandidateEngagement**: Structured records for questionnaires, forums, and other touch points. `Engagement` stores event metadata (title, date, links, optional `raceId`), while `CandidateEngagement` indicates whether each candidate participated and captures moderator notes. These replace the legacy markdown blob in `candidate.engagement` while still supporting a fallback.

### Wiki & Auth

- **User**: Accounts created via magic link. Stores role, optional linked `candidateId`, trust counters, and a public-facing ID.
- **LoginToken**: Magic-link token store with expiry and used-state tracking.
- **Edit**: Persistent audit log of contributor changes, including moderator notes and timestamps for every workflow stage.

### Enums

- `OfficeType`, `ElectionType`, `EndorsementType`, `ForAgainst`, `UserRole`, `EntityType`, and `EditStatus` constrain key fields to acceptable values.

Prisma preview feature `fullTextSearchPostgres` is enabled but not yet in heavy use—future scripts can leverage it for improved matching.

## Data Access Layer (`lib/`)

- **`lib/queries.ts`**: Centralized Prisma queries for pages. Encapsulates include trees (`raceInclude`, `guideInclude`), port race grouping, structured engagement joins, and slug helpers. By concentrating queries here, server components remain lean and data fetching can easily be reused by API routes if needed.
- **`lib/db.ts`**: Creates a singleton Prisma client to avoid exhausting connection pools during hot reloads.
- **`lib/calculateFundraising.ts`**: Converts raw contributions into totals, donor counts, and top-donor lists for UI display.
- **`lib/wa-state/*`**: Socrata client and helper utilities for PDC data (contributions, enforcement, calendar, results placeholder). `WAStateClient` applies jurisdiction filters for Benton/Franklin targets and handles pagination/rate limiting.
- **`lib/normalize/names.ts`**: Fuzzy matching helper used by enforcement imports and other scripts to reconcile external names with candidate records.
- **`lib/wiki/*`**: Field whitelists (`fields.ts`), override helpers (`utils.ts`), hooks for edit-mode toggles, and unique public-ID generation (`publicId.ts`). This layer sustains the wiki editing rules and enables shared validation between client and server.
- **`lib/auth/*`**: Mailgun integration, JWT token utilities, React context provider, and CSRF token helper for POST endpoints.

## Data Processing Scripts

Scripts live under `scripts/` and are designed to be idempotent, safe to rerun, and narrowly scoped. Below are the ones relevant to letters-to-the-editor tracking and donor data.

### Letters to the Editor Pipeline

1. **`npm run import:letters` → `scripts/import/scrape-letters.ts`**
   - Uses Playwright to crawl the Tri-City Herald’s letters section, respecting pagination and stopping once it reaches the last processed article (tracked by existing `Endorsement` entries).
   - Requires `ANTHROPIC_API_KEY` and Playwright browsers installed (`npx playwright install chromium`).
   - Pulls the candidate roster for the 2025 election from the database, then prompts Claude (`claude-3-5-sonnet-20241022`) to analyze each article for **FOR/AGAINST/REVIEW** mentions alongside supporting excerpts.
   - Writes a CSV to `scripts/import/letter-endorsements.csv` and a secondary review file for ambiguous items. The console summary highlights total matches and items that need manual review.

2. **`npm run import:letters:load` → `scripts/import/import-letter-endorsements.ts`**
   - Reads the CSV produced by the scraper, skips `REVIEW`/`IGNORE` rows, and upserts `Endorsement` records tied to the correct `Candidate`.
   - Ensures deduplication by checking `candidateId + endorser + url`. Requires `DATABASE_URL`.
   - Reports counts of imported, skipped, and error rows; useful to rerun after manually cleaning the CSV or re-scraping.

3. **Supporting docs**: `scripts/import/README-letters.md` outlines prerequisites and usage. `scrape-letters.mlld` is an earlier natural-language plan preserved for reference.

### Donor & Contribution Imports

1. **`npm run import:pdc:fast <year>` → `scripts/import/pdc-fast.ts`**
   - Streaming Socrata client fetches contributions (`kv7h-kjye`) filtered to Tri-Cities jurisdictions.
   - Batches contributions (500 per insert) to minimize Prisma load: deletes conflicting IDs, bulk inserts, then runs an aggregated SQL query to compute each candidate’s donor summary text (`Reported raised $X from Y+ donors`).
   - Accepts optional `SOCRATA_API_ID` / `SOCRATA_API_SECRET` to avoid strict unauthenticated rate limits.
   - Prefer this flavor for large imports because it reduces Prisma roundtrips and leverages SQL aggregation for donor summaries.

2. **`npm run import:pdc <year>` → `scripts/import/pdc.ts`**
   - Earlier, slower importer; processes each contribution sequentially via `prisma.contribution.upsert`. Still valid when diagnosing issues because it retains richer logging per record and rebuilds donor summaries client-side after every import.
   - Shares the same requirements and filtering logic as `pdc-fast.ts`.

3. **Maintenance scripts**:
   - `scripts/clear-contributions.ts`: purges all contributions and resets donor summaries before a fresh import if the dataset becomes inconsistent.
   - `scripts/check-contributions.ts`, `scripts/check-contributions-detailed.ts`, and `scripts/check-contribution-amounts.ts`: sanity-check utilities for counts, ranges, and sample inspection. These scripts help verify data integrity after an import without hitting the UI.

### Enforcement & Related Data

While not directly part of donor or letter ingestion, enforcement data rounds out the "candidate background" surface presented in the UI:

- **`npm run import:enforcement`** → `scripts/import/enforcement-cases.ts` pulls PDC enforcement actions (`a4ma-dq6s`), uses `NameMatcher` to attach cases to candidates with confidence scores, and upserts into the `EnforcementCase` table.
- An `--incremental` flag limits imports to items updated after the last run; otherwise it refreshes the entire dataset.
- Severe statuses (`VIOLATION_STATUSES`) are flagged for moderators to highlight manually.

These cases appear on candidate detail pages alongside contributions and endorsements, so keeping them in sync is part of the data hygiene workflow during the election.

### Questionnaire & Engagement Tracking (New in October 2025)

A new set of import scripts track candidate participation in questionnaires, forums, and surveys. All scripts follow a safety-first pattern with dry-run mode by default and CSV output for review.

**0. City + School Questionnaire Responses (2025)**
- **Source files**: `2025-city-council-responses.csv` and `2025-school-board-responses.csv` in the repo root (embedded newlines in headers, occasional trailing spaces/accents on names).
- **Importer**: `npm run import:questionnaire city-council` / `school-board` (script lives at `scripts/import/questionnaire-import.ts`). Each run hardcodes question text, trims/aliases names, deletes prior responses, and recreates the dataset. Unmatched names are written to `scripts/import/unmatched-<type>.txt`.
- **Verification**: After running the importer, spot-check `/2025/candidate/<slug>` plus `/2025/compare/<slug>` and ensure the compare table matches the legacy markup (`legacy/gatsby/src/components/compare/CompareTable.js`). Re-run the import to confirm idempotency.

**Feature Flag**: Set `IMPORT_MODE=db` to enable database writes; otherwise scripts output CSV only.

**1. TCRC Questionnaire**
- **`npm run import:tcrc`** → `scripts/import/tcrc-questionnaire.ts` extracts candidate responses from the TCRC PDF questionnaire using AI parsing (`pdftotext` + Claude). Outputs to `scripts/import/tcrc-responses.csv`.
- **`npm run import:tcrc:load`** → `scripts/import/tcrc-questionnaire-load.ts` loads the CSV into the database, creating an `Engagement` record for "TCRC Questionnaire 2025" and linking candidates via `CandidateEngagement`.
- Requires: `ANTHROPIC_API_KEY`, `pdftotext` (brew install poppler), PDF file in project root.

**2. TCRC Video Forums**
- **`npm run import:tcrc:videos`** → `scripts/import/tcrc-videos.ts` analyzes transcript files from `/transcripts` directory, uses AI to identify participants, and creates `Engagement` records per video with participation tracking.
- Requires: `ANTHROPIC_API_KEY`, transcript files present.
- Safe to rerun—uses upsert pattern keyed on video ID.

**3. Ballotpedia Survey & Profile Data**
- **`npm run import:ballotpedia`** → `scripts/import/ballotpedia-scrape.ts` constructs Ballotpedia URLs from candidate names/offices, scrapes survey completion status, bio, website, and email. Outputs `scripts/import/ballotpedia-data.csv`.
- **`npm run import:ballotpedia:load`** → `scripts/import/ballotpedia-load.ts` updates candidate fields (`bio`, `website`, `email`) **ONLY if currently NULL** and no wiki overrides exist. Creates `Engagement` for completed surveys.
- Requires: Playwright browsers (`npx playwright install chromium`).
- Respects wiki overrides—never overwrites existing data.

**4. WRCG (West Richland Citizens Group)**
  - **`npm run import:wrcg`** → `scripts/import/wrcg-scrape.ts` scrapes West Richland candidate questionnaires from https://www.wrcg.org/2025-elections. Handles Wix site rendering with conservative rate limiting. Outputs `scripts/import/wrcg-responses.csv`.
  - **`npm run import:wrcg:load`** → `scripts/import/wrcg-load.ts` loads participation data into `Engagement` and `CandidateEngagement` tables.
  - Requires: `ANTHROPIC_API_KEY`, Playwright browsers.
  - Scope: West Richland candidates only (~9 candidates in 2025). Ensure the **Benton County City of West Richland Mayor** race exists in Prisma before running so the mayoral contest receives questionnaire coverage.

**5. Vote411 (LWV national questionnaire)**
  - **`npm run import:lowv`** → `scripts/import/lowv-scrape.ts` uses Vote411’s REST API (client credentials exposed in the public widget) to pull participation plus Q&A for Kennewick, Pasco, Richland, West Richland, and port races. Outputs `scripts/import/lowv-responses.csv` and `scripts/import/lowv-questionnaire-responses.csv` while flagging unmatched names in `scripts/import/unmatched-lowv.txt`.
  - **`npm run import:lowv:load`** (`IMPORT_MODE=db`) writes the shared `Engagement` (“LWV Vote411 Questionnaire 2025”) and per-candidate participation records with direct Vote411 links. Review the CSVs before loading.

**Shared Configuration**: `scripts/import/config.ts` provides rate-limit constants, emoji vocabulary, CSV helpers, and the `isDryRun()` feature flag check used by all new importers.

**Data Model**: All engagement scripts write to `Engagement` (event metadata) and `CandidateEngagement` (participation tracking). See `prisma/schema.prisma:165-197` for model definitions.

**Documentation**: Full usage details in `scripts/import/README.md`.

## Operational Flow

1. **Data ingestion**: Run the relevant scripts (letters, contributions, enforcement) in a terminal with the correct `.env` in place. Each script is safe to rerun; they upsert or batch-delete-reinsert rather than blindly duplicating rows.
2. **Content moderation**: Community edits enter the `Edit` queue. Moderators use `/moderate` to accept or reject; approvals populate `*Wiki` fields, immediately affecting front-end pages via `preferWiki*` helpers.
3. **Rendering**: Server-rendered pages fetch fresh data on request, revalidated hourly for guides and region pages. Client components (compare views, moderation UI) fetch JSON from API routes for dynamic behavior.
4. **Deployment**: No dedicated CI is configured in-repo, but `ARCHITECTURE.md` assumes a manual deploy process that runs `npm install`, `npx prisma generate`, and `npm run build`.

## Key Dependencies & Configuration

- **Environment**: `.env` requires `DATABASE_URL`, optional Socrata credentials, Mailgun settings, `JWT_SECRET`, and `NEXT_PUBLIC_BASE_URL`. Letter imports add `ANTHROPIC_API_KEY`.
- **External Services**: Socrata (PDC data), Mailgun (email), Anthropic (AI parsing for letters), Playwright (headless browser for scraping).
- **TypeScript configs**: `tsconfig.json` targets the Next.js app; `tsconfig.scripts.json` compiles standalone scripts. Note that `lib/**/*` is excluded from the main app typecheck per repo conventions.

## Extending the System

- **Adding new data feeds**: Implement a script under `scripts/`, reuse `lib/wa-state` or similar API helpers, and persist to Prisma models. Document new scripts in `AGENTS.md` and reference them here.
- **Schema changes**: Introduce new Prisma models or columns with migrations, then update shared queries in `lib/queries.ts` and relevant components. Remember to add wiki overrides if community editing is desired.
- **Front-end features**: Compose new server components inside the App Router, sourcing data via existing query helpers or new ones in `lib/queries.ts`. Keep wiki override precedence consistent by using `preferWikiString`/`getWikiValue`.

This architecture has been tuned for a single volunteer maintainer: scripts are straightforward, imports are idempotent, and the front-end reflects database changes immediately without additional tooling.

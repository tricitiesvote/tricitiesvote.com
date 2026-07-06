# Multi-Source Questionnaires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Config-folder-based questionnaire imports from any organization, with scale-aware (4 or 5 point) compare grids, source attribution, non-responder display, collapsible sections, and a whole-field 2026 board — starting with the CCL WA-04 climate survey.

**Architecture:** Additive Prisma columns on `Questionnaire` (`scale`, `sourceName`, `sourceUrl`, `hidden`); a `data/questionnaires/<slug>/` folder convention (questionnaire.json + responses.json + originals) read by one generic importer script; display components become scale-driven instead of hard-coded 4-point; the existing compare-all route gains 2026 office types and an `all` board.

**Tech Stack:** Next.js App Router (server components), Prisma/PostgreSQL (Railway), ts-node scripts via `tsconfig.scripts.json`.

Spec: `docs/superpowers/specs/2026-07-07-multi-source-questionnaires-design.md`.

## Global Constraints

- 2025 pages must render identically: `scale` defaults to 4 with the existing 1–4 value encoding; `2025-ballotpedia` gets `hidden: true`; the two 2025 slugs keep displaying.
- No test framework exists. Verify with `npx tsc --noEmit`, importer dry-run output, and the local dev site (`npm run dev`).
- DB is the production Railway database — importer is dry-run by default, writes only with `IMPORT_MODE=db`.
- Git: one-line commit messages, no Claude branding, `git add` individual files.
- Work happens on branch `questionnaires-2026`.

---

### Task 1: Schema — scale, source, hidden

**Files:**
- Modify: `prisma/schema.prisma` (Questionnaire model, ~line 209)

**Interfaces:**
- Produces: `Questionnaire.scale: Int` (4 or 5), `Questionnaire.sourceName/sourceUrl: String?`, `Questionnaire.hidden: Boolean`. All later tasks read these.

- [ ] **Step 1: Edit the model**

```prisma
model Questionnaire {
  id          String                 @id @default(cuid())
  slug        String                 @unique
  year        Int
  title       String
  regionId    String?
  scale       Int                    @default(4)
  sourceName  String?
  sourceUrl   String?
  hidden      Boolean                @default(false)

  region      Region?                @relation(fields: [regionId], references: [id])
  questions   QuestionnaireQuestion[]
  responses   QuestionnaireResponse[]

  @@index([year])
  @@index([regionId])
}
```

- [ ] **Step 2: Migrate**

Run: `npx prisma migrate dev --name questionnaire-scale-source-hidden`
Expected: migration applied, client regenerated. (Additive with defaults — safe on live data.)

- [ ] **Step 3: Hide Ballotpedia**

Run a one-off: `npx ts-node --project tsconfig.scripts.json -e "..."` or a node script updating `prisma.questionnaire.update({ where: { slug: '2025-ballotpedia' }, data: { hidden: true } })`. Verify with a select that `hidden=true`.

- [ ] **Step 4: Commit**

`git add prisma/schema.prisma prisma/migrations/...` then commit: `add scale, source, and hidden fields to questionnaires`

### Task 2: Config convention + generic importer

**Files:**
- Create: `data/questionnaires/README.md`
- Create: `data/questionnaires/2026-ccl-wa04/questionnaire.json`
- Create: `data/questionnaires/2026-ccl-wa04/responses.json`
- Create: `data/questionnaires/2026-ccl-wa04/originals/` (copy the two docx from `.fray/assets/thrd-pt30dqoj/`, renamed to their original filenames)
- Create: `scripts/import/questionnaire-load.ts`
- Modify: `package.json` (add script `"import:questionnaire:load": "ts-node --project tsconfig.scripts.json scripts/import/questionnaire-load.ts"`)

**Interfaces:**
- Consumes: Task 1 columns; `NameMatcher` from `lib/normalize/names` (pattern in `scripts/import/questionnaire-import.ts:329-352`, threshold 0.82); `generateEngagementSlug` from `scripts/import/config`; `slugify` from `lib/utils`.
- Produces: CLI `npm run import:questionnaire:load -- data/questionnaires/<slug>` (dry-run; `IMPORT_MODE=db` writes).

**questionnaire.json shape** (validated by the script):

```jsonc
{
  "slug": "2026-ccl-wa04",
  "year": 2026,
  "title": "Climate & Energy Survey — U.S. House District 4",
  "sourceName": "Citizens Climate Lobby Tri-Cities",
  "sourceUrl": "https://citizensclimatelobby.org/chapters/WA_Tri-Cities/",
  "scale": 5,
  "engagement": { "name": "CCL Climate Survey", "date": "2026-06-26" },
  "coverage": { "officeTitles": ["U.S. House District 4"] },
  "questions": [
    { "position": 1, "type": "AB", "question": "Global Warming", "statementA": "...", "statementB": "..." },
    { "position": 11, "type": "OPEN", "question": "..." }
  ]
}
```

CCL content comes from `tmp/ccl/placements.json` (verified cell-by-cell against the docx table) and the statements text in `tmp/ccl/a2af67e07565f025.txt`. Question 11 is the OPEN statement question. Hughs' statement concatenates his survey statement and his 6/24 follow-up email (both in the doc). Kobiesa/Poore/Sessler/Vaz/Valencia/Duresky statements as written. Initials map: JD=John Duresky, JH=John C. Hughs, DP=Devin Poore, JK=Jacek "Jack" Kobiesa, JS=Jerrod Sessler, KV=Ken Vaz, FV=Favian Valencia (DB spellings — doc has "Favien"/"Hughes" variants; rely on NameMatcher + per-folder alias map in questionnaire.json `"aliases": { "Favien Valencia": "Favian Valencia" }` if fuzzy match fails).

**Importer behavior** (single `main()`; mirror `questionnaire-import.ts` structure):

1. Read folder arg; parse both JSON files; validate: unique positions, AB questions have both statements, `scale` is 4 or 5, every AB answer value is an integer in `1..scale`, OPEN answers are non-empty strings.
2. Resolve coverage: `prisma.office.findMany({ where: { title: { in: coverage.officeTitles } } })` then all candidates of those offices for `year` (respecting `electionYear`). Fail if an office title matches nothing.
3. Match each response's `candidate` name via NameMatcher against covered candidates only; apply config `aliases` first. Any unmatched name: print and exit 1 (no silent drops).
4. Dry run prints: questionnaire summary, per-question response counts, responders/non-responders. With `IMPORT_MODE=db`:
   - upsert `Questionnaire` by slug (title, year, scale, sourceName, sourceUrl, hidden ?? false)
   - upsert each `QuestionnaireQuestion` by `questionnaireId_position`
   - `deleteMany` + `createMany` responses (deterministic id `${candidateId}-${questionId}` like the 2025 script)
   - engagement sync: `generateEngagementSlug(engagement.name, date)`; upsert `Engagement` (primaryLink = `/${year}/compare/${slugify(office.title)}` of the first covered office); upsert `CandidateEngagement` for every covered candidate with `participated: responders.has(candidateId)` and per-candidate `link` to their race compare page.

- [ ] **Step 1: Write README.md** — the recipe: folder layout, JSON shapes, alias map, dry-run→db workflow, "convert any source format (docx/PDF/CSV) into these two JSON files" guidance, and the validation guarantees.
- [ ] **Step 2: Build the CCL folder** from tmp/ccl artifacts; copy originals.
- [ ] **Step 3: Write questionnaire-load.ts** per behavior above.
- [ ] **Step 4: Dry-run** `npm run import:questionnaire:load -- data/questionnaires/2026-ccl-wa04`
Expected: 11 questions (10 AB + 1 OPEN); 7 responders each with 10 AB answers (+statement for those who gave one); 4 non-responders (McKinney, Boehnke, Saavedra, Rossi); zero unmatched names.
- [ ] **Step 5: Typecheck** `npx tsc --noEmit --project tsconfig.scripts.json` (or the repo's standard check).
- [ ] **Step 6: Commit** `add generic questionnaire importer and CCL WA-04 config`

### Task 3: Scale-aware display + attribution + non-responders + collapsible

**Files:**
- Modify: `components/compare/CompareQuestionnaires.tsx`
- Modify: `components/questionnaire/QuestionnaireResponses.tsx`
- Modify: `styles/globals.css` (only additions: `.questionnaire-source`, `.questionnaire-nonresponders`, `details.questionnaire-compare-section summary` styles matching existing look)

**Interfaces:**
- Consumes: Task 1 columns.
- Produces: `CompareQuestionnaires` new props `{ collapsed?: boolean }`; `AbRow.buckets: CandidateEntry[][]` replaces strongA/leanA/leanB/strongB.

Key changes in `CompareQuestionnaires.tsx`:

- Query `include` adds nothing; `findMany` selects new columns automatically. Add `hidden: false` to `where`.
- Delete `TRI_CITIES_SLUGS`/`isTriCitiesQuestionnaire`; the existing `.filter(section => section.abRows.length > 0 || section.openQuestions.length > 0)` already keeps only questionnaires with responses from the page's candidates — that becomes the display rule.
- Scale labels helper:

```ts
function scaleLabels(scale: number): string[] {
  return scale === 5
    ? ['Strong A', 'Lean A', 'Neutral', 'Lean B', 'Strong B']
    : ['Strong A', 'Lean A', 'Lean B', 'Strong B']
}
const BUCKET_CLASSES_4 = ['strong-a', 'lean-a', 'lean-b', 'strong-b']
const BUCKET_CLASSES_5 = ['strong-a', 'lean-a', 'neutral', 'lean-b', 'strong-b']
```

- `buildSection` buckets by `value - 1` into `scale` arrays; table header/body map over labels/buckets.
- Attribution under the section heading when `sourceName` present:

```tsx
<p className="questionnaire-source">
  Survey by {sourceUrl ? <a href={sourceUrl}>{sourceName}</a> : sourceName}
</p>
```

- Non-responders: compute `respondedIds` per questionnaire; candidates in `orderedCandidates` missing from it render in a muted strip:

```tsx
{nonResponders.length > 0 && (
  <p className="questionnaire-nonresponders">
    Did not respond: {nonResponders.map(c => c.name).join(', ')}
  </p>
)}
```

  (Names, not faces — the faces belong to answer cells; keep the strip quiet. Include it also when `hideOpenQuestions`.)
- Collapsible: wrap each section in `<details className="questionnaire-compare-section" open={!collapsed}>` with `<summary>` holding the heading + attribution. New prop `collapsed?: boolean` (default false). Note: the current `hideOpenQuestions` branch also suppresses the `<h2>` — move the heading into `<summary>` unconditionally so collapsed sections are identifiable on the board.

`QuestionnaireResponses.tsx`: replace the fixed `SCALE_LABELS` with `scaleLabels(q.scale)` indexed by `value - 1`; add the attribution line under `<h4>{section.title}</h4>`. Keep `scale-${value}` class (add `.scale-5` CSS mirroring `.scale-4`).

- [ ] **Step 1: Implement both components + CSS additions**
- [ ] **Step 2: Typecheck** `npx tsc --noEmit`
- [ ] **Step 3: 2025 regression check** — `npm run dev`, open a 2025 archive… (2025 pages aren't served by this app anymore; instead verify with `CURRENT_ELECTION_YEAR` untouched that `/2026` pages render and, for logic parity, that the build passes; the real 2025 archive is frozen and unaffected.)
- [ ] **Step 4: Commit** `scale-aware questionnaire display with attribution, non-responders, collapsible sections`

### Task 4: Whole-field board

**Files:**
- Modify: `app/[year]/compare-all/[regionOrTri]/[officeType]/page.tsx`

**Interfaces:**
- Consumes: `CompareQuestionnaires` `collapsed` prop from Task 3.
- Produces: routes `/{year}/compare-all/tri/{all|us-house|us-senate|legislature|county|judicial|city-council|school-board}`.

Changes:

- Replace the binary officeType with a mapping table:

```ts
const OFFICE_TYPE_MAP: Record<string, OfficeType[]> = {
  'city-council': ['CITY_COUNCIL', 'MAYOR'],
  'school-board': ['SCHOOL_BOARD'],
  'us-house': ['US_HOUSE'],
  'us-senate': ['US_SENATE'],
  'legislature': ['STATE_SENATOR', 'STATE_REPRESENTATIVE'],
  'county': ['COUNTY_COMMISSIONER', 'SHERIFF', 'PROSECUTOR'],
  'judicial': ['SUPERIOR_COURT_JUDGE'],
}
// 'all' = no office-type filter
```

- `getAggregateCandidatesCached` takes `officeTypes: OfficeType[] | null` (null = all); unknown officeType param → `notFound()`.
- Labels: map key → human label (`us-house` → 'U.S. House', `all` → 'All Candidates', etc.) for title/OG.
- `generateStaticParams`: for the current year emit `tri/all` plus every key in the map that has ≥1 candidate that year (query distinct office types once).
- Render `<CompareQuestionnaires collapsed={params.officeType === 'all'} ...>`; keep `hideOpenQuestions` true for aggregate views.
- Keep the West-Richland school-board redirect and `?show=all` behavior.

- [ ] **Step 1: Implement**
- [ ] **Step 2: Verify locally** — `/2026/compare-all/tri/all` and `/2026/compare-all/tri/us-house` render (empty until Task 5 import, then populated).
- [ ] **Step 3: Commit** `extend compare-all to 2026 office types and whole-field board`

### Task 5: Import CCL + end-to-end verify

- [ ] **Step 1:** `IMPORT_MODE=db npm run import:questionnaire:load -- data/questionnaires/2026-ccl-wa04`
- [ ] **Step 2: DB check** — questionnaire scale=5, 11 questions, 7×10 AB + open responses, engagement rows: 11 CandidateEngagement (7 participated, 4 not).
- [ ] **Step 3: Site check** (`npm run dev`): WA-04 compare page (`/2026/compare/u-s-house-district-4` — confirm actual slug via slugify) shows the CCL section with Neutral column and 7 placed candidates matching `tmp/ccl/placements.json` spot checks (Q1: JD/JH/DP strong-A, KV lean-A, FV neutral, JK lean-B, JS strong-B); non-responder strip lists McKinney, Boehnke, Saavedra, Rossi; attribution link renders. Candidate page (Duresky) shows scale answers + statement. `/2026/compare-all/tri/all` shows the whole field with collapsed sections. At-a-glance participation on the WA-04 race page reflects the engagement.
- [ ] **Step 4:** Push branch, open PR to main, post results to fray.

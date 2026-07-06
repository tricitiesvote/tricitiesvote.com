# Multi-Source Questionnaires (2026)

Approved by Adam in fray (planning thread, 2026-07-06/07): original proposal msg-sgbp7ask plus additions in msg-vwnebjhk (configurable scales, collapsed rendering, whole-field board, answered/not-answered display feeding at-a-glance participation).

## Problem

The 2025 question/answer grid works, but adding a new questionnaire source requires writing a new import script with hard-coded questions. For 2026 we expect questionnaires from a range of outside organizations (first: Citizens Climate Lobby Tri-Cities, WA-04 congressional survey) in arbitrary formats (docx, PDF, CSV). Three blockers:

1. Questions live inside `scripts/import/questionnaire-import.ts`, not data files.
2. `CompareQuestionnaires` only displays questionnaires whose slug contains `city-council` or `school-board`, so nothing 2026 can display.
3. No source-organization attribution, no neutral scale point (CCL uses a 5-point scale with Neutral; 2025 used a forced-choice 4-point), and no display of who declined to answer.

## Schema changes (additive, backward compatible)

On `Questionnaire`:

- `scale Int @default(4)` — number of A/B scale points. 4 = Strong A, Lean A, Lean B, Strong B (values 1–4, the 2025 encoding, unchanged). 5 = Strong A, Lean A, Neutral, Lean B, Strong B (values 1–5).
- `sourceName String?` / `sourceUrl String?` — the organization that ran the survey, for attribution in every rendering.
- `hidden Boolean @default(false)` — excluded from compare grids (set true for `2025-ballotpedia`, which is stored but was never displayed; preserves current behavior once the slug allowlist is removed).

`QuestionnaireResponse.value` stays `Int?`; valid range is 1..scale.

## Config convention: one folder per questionnaire

```
data/questionnaires/
  README.md                     # the import recipe (below)
  2026-ccl-wa04/
    questionnaire.json          # metadata + questions
    responses.json              # per-candidate answers
    originals/                  # source files as received
```

`questionnaire.json`:

```jsonc
{
  "slug": "2026-ccl-wa04",
  "year": 2026,
  "title": "Climate & Energy Survey — U.S. House District 4",
  "sourceName": "Citizens Climate Lobby Tri-Cities",
  "sourceUrl": "https://citizensclimatelobby.org/chapters/WA_Tri-Cities/",
  "scale": 5,
  "engagement": { "name": "CCL Climate Survey" },
  "coverage": { "officeTitles": ["U.S. House District 4"] },
  "questions": [
    { "position": 1, "type": "AB", "question": "Global Warming",
      "statementA": "…", "statementB": "…" },
    { "position": 11, "type": "OPEN", "question": "What would you do, as a member of Congress, about climate change in terms of policy and legislation?" }
  ]
}
```

`responses.json`:

```jsonc
{
  "responses": [
    { "candidate": "John Duresky",
      "answers": { "1": 1, "2": 5, "11": "I believe climate change is…" },
      "comments": { } }
  ]
}
```

- `coverage.officeTitles` names the offices whose candidates were surveyed (matched against `Office.title` for the year). It determines who counts as a non-responder.
- Candidate names are matched with the existing `NameMatcher` fuzzy logic plus the shared alias map; unmatched names fail the run with a clear message (no silent drops).

## Generic importer

`scripts/import/questionnaire-load.ts <folder>` (npm: `import:questionnaire:load -- data/questionnaires/2026-ccl-wa04`). Dry-run by default; `IMPORT_MODE=db` writes. Behavior:

1. Validate config: positions unique, AB questions have both statements, answers in 1..scale, every response candidate matches a DB candidate in a covered office.
2. Upsert `Questionnaire` (by slug) and `QuestionnaireQuestion` rows (by questionnaireId+position); delete-and-rebuild all `QuestionnaireResponse` rows for the questionnaire (same strategy as 2025).
3. Sync participation: upsert an `Engagement` (name from config, link to the race compare page) and a `CandidateEngagement` for **every** candidate in the covered offices — `participated: true` for responders, `false` for the rest. This feeds the existing at-a-glance participation row.

The 2025 script stays as-is (historical); the README points new work at the generic path.

## Display changes

`components/compare/CompareQuestionnaires.tsx`:

- Replace the `isTriCitiesQuestionnaire` slug allowlist with: show a questionnaire when `hidden` is false **and** at least one of the page's candidates has a response.
- Scale-aware table: bucket by `value` into `scale` columns; render a Neutral column when `scale` is 5. Header labels come from the scale.
- Attribution line under each section title: "Survey by {sourceName}" linking to `sourceUrl`.
- Non-responder strip per section: "Did not respond:" followed by the candidate faces (same `CompareCandidateStatement` rendering, muted) for covered candidates with no responses.
- Collapsible sections: each questionnaire section renders inside `<details>` with the title/attribution in `<summary>`; a `collapsed` prop controls the default (open on race compare pages, collapsed on the whole-field board).

`components/questionnaire/QuestionnaireResponses.tsx` (candidate page): scale-aware labels (replace the fixed 4-entry `SCALE_LABELS`), plus the attribution line.

## Whole-field board

Extend `/[year]/compare-all/[regionOrTri]/[officeType]`:

- Add 2026 office-type mappings: `us-house` → US_HOUSE, `us-senate` → US_SENATE, `legislature` → STATE_SENATOR + STATE_REPRESENTATIVE, `county` → COUNTY_COMMISSIONER + SHERIFF + PROSECUTOR, `judicial` → SUPERIOR_COURT_JUDGE.
- Add `all` as an officeType: every candidate in every race for the year (with `regionOrTri = tri`), grouped by race, colors assigned per race (existing mod-7 cycling), questionnaire sections collapsed by default. This is the "whole primary field on a single board" view.
- Non-responders appear on the board via the non-responder strip, so participation is visible at field level.

## Out of scope

- No CMS/UI for authoring questionnaires — folders + JSON, imported by an agent following the README.
- No changes to the 2025 import scripts or 2025 rendering output (2025 pages must render pixel-identical: scale defaults to 4, slug-allowlisted questionnaires all have responses so the new filter keeps them, Ballotpedia gets `hidden: true`).

## Verification

- 2025 spot check: a Kennewick city-council compare page and one candidate page render the same sections as production.
- 2026: WA-04 compare page shows the CCL section with Neutral column, 7 respondents placed per the source table, 4 non-responders in the strip, attribution link; candidate pages show scale answers + statement; `/2026/compare-all/tri/all` shows the whole field; at-a-glance shows participation for the 11 WA-04 candidates.

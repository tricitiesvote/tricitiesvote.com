# Questionnaire Configs

Each folder here is one questionnaire from one source organization, ready to import with the generic loader. This is the single path for getting outside questionnaires (surveys, candidate forums, scored grids) into the site, regardless of what format the organization sends.

## Workflow

1. **Create a folder** named `<year>-<source>-<scope>` (e.g. `2026-ccl-wa04`).
2. **Save the source files as received** into `originals/` — docx, PDF, CSV, whatever. These are the provenance record; never edit them.
3. **Transcribe** the questions into `questionnaire.json` and the answers into `responses.json` (shapes below). Keep candidate-written text verbatim, including typos — these are their words.
4. **Dry-run** the import and read the report (matched candidates, response counts, non-responders):

   ```bash
   npm run import:questionnaire:load -- data/questionnaires/<folder>
   ```

5. **Write** once the dry run is clean:

   ```bash
   IMPORT_MODE=db npm run import:questionnaire:load -- data/questionnaires/<folder>
   ```

The importer is idempotent: questions upsert by position, responses are deleted and rebuilt, so re-running after a correction is safe.

## questionnaire.json

```jsonc
{
  "slug": "2026-ccl-wa04",              // unique, stable; also the folder name
  "year": 2026,                          // electionYear
  "title": "Climate & Energy Survey — U.S. House District 4",
  "sourceName": "Citizens' Climate Lobby Tri-Cities",  // shown as attribution on the site
  "sourceUrl": "https://citizensclimatelobby.org/",    // attribution link (optional)
  "scale": 5,                            // 4 = StrongA/LeanA/LeanB/StrongB, 5 adds Neutral in the middle
  "hidden": false,                       // true = store but never display (optional, default false)
  "official": false,                     // true = a Tri-Cities Vote questionnaire, not an outside org's (optional)
  "regionName": "Benton County",         // optional; scopes display to a region's guides
  "engagement": {
    "name": "CCL Climate Survey",       // at-a-glance participation row label
    "date": "2026-06-26"                 // when the survey ran
  },
  "coverage": {
    "officeTitles": ["U.S. House District 4"]  // exact Office.title values; defines who was surveyed
  },
  "aliases": {
    "Favien Valencia": "Favian Valencia"  // source-doc spelling -> database spelling (optional)
  },
  "questions": [
    { "position": 1, "type": "AB", "question": "Global Warming",
      "statementA": "Global warming, driven by human activities threatens our well-being",
      "statementB": "The climate has always changed by itself, and is nothing to worry about" },
    { "position": 11, "type": "OPEN",
      "question": "What would you do, as a member of Congress, about climate change?" }
  ]
}
```

- `coverage.officeTitles` determines the candidate pool: everyone running for those offices that year. Candidates in the pool with no responses are displayed as "did not respond" and recorded as not participating on their at-a-glance row.
- `scale` applies to all AB questions in the questionnaire. Values are 1 (Strong A) through `scale` (Strong B); on a 5-point scale, 3 is Neutral.

## responses.json

```jsonc
{
  "responses": [
    {
      "candidate": "John Duresky",       // database name (aliases map handles source-doc variants)
      "answers": {
        "1": 1,                           // AB question: integer 1..scale
        "11": "Full text answer..."      // OPEN question: verbatim text
      },
      "comments": {
        "1": "Optional explanation the candidate attached to their scale answer"
      }
    }
  ]
}
```

Only include candidates who responded. Candidate names are matched fuzzily against the covered offices' candidates; anything that doesn't match fails the run loudly — fix the name or add an alias.

## Validation guarantees

The importer refuses to write when: a question position repeats; an AB question is missing either statement; an answer value is outside `1..scale`; an answer references an unknown question position; a candidate can't be matched; or an office title matches nothing in the database for that year.

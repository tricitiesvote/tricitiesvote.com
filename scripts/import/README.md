# Import Scripts

This directory contains data import scripts for the Tri-Cities Vote election guide system. All scripts follow a consistent pattern with safety-first features including dry-run mode and CSV output for review.

## 🔒 Safety Features

All new import scripts (October 2025+) include built-in safety features:

- **Dry-run mode by default**: Scripts write to CSV files for review before database writes
- **Explicit database mode**: Use `IMPORT_MODE=db` environment variable to enable database writes
- **CSV output**: All scripts produce CSV files showing what will be (or was) imported
- **Idempotent**: Safe to run multiple times - scripts use upsert patterns to avoid duplicates
- **Error handling**: Scripts continue processing even if individual records fail

### Feature Flag

```bash
# Default: CSV output only (safe)
npm run import:tcrc

# Explicit database writes
IMPORT_MODE=db npm run import:tcrc:load
```

## 📊 Import Scripts Overview

### TCRC (Tri-City Regional Chamber)

**1. TCRC Questionnaire (PDF)**

Extracts candidate responses from the TCRC PDF questionnaire.

```bash
# Extract questionnaire data from PDF
npm run import:tcrc

# Review the output: scripts/import/tcrc-responses.csv

# Load to database (dry-run)
npm run import:tcrc:load

# Load to database (for real)
IMPORT_MODE=db npm run import:tcrc:load
```

**Requirements:**
- `pdftotext` installed (brew install poppler)
- `ANTHROPIC_API_KEY` in environment
- PDF downloaded to project root: `2025_Vote_for_Business_Primary_Candidate_Questionnaire.pdf`

**Output:**
- `scripts/import/tcrc-responses.csv`
- Creates `Engagement` record for "TCRC Questionnaire 2025"
- Creates `CandidateEngagement` records for participation tracking

---

**2. TCRC Video Forums**

Analyzes video transcripts to track candidate participation in forum videos.

```bash
# Process all transcripts (dry-run by default)
npm run import:tcrc:videos

# Process and write to database
IMPORT_MODE=db npm run import:tcrc:videos
```

**Requirements:**
- `ANTHROPIC_API_KEY` in environment
- Transcript files in `/transcripts` directory
- Database access for candidate list

**Output:**
- `scripts/import/tcrc-videos.csv` (or `tcrc-videos-dry-run.csv`)
- Creates `Engagement` records for each video
- Creates `CandidateEngagement` records for participants

---

### Ballotpedia

Scrapes candidate profiles from Ballotpedia including survey completion status, bio, and contact information.

```bash
# Scrape Ballotpedia (always outputs CSV)
npm run import:ballotpedia

# Review: scripts/import/ballotpedia-data.csv

# Load to database (dry-run)
npm run import:ballotpedia:load

# Load to database (for real)
IMPORT_MODE=db npm run import:ballotpedia:load
```

**Requirements:**
- Playwright browsers installed: `npx playwright install chromium`
- Database access for candidate list

**Behavior:**
- Constructs Ballotpedia URLs from candidate names and offices
- Detects survey completion (looks for "completed Ballotpedia survey" text)
- Updates candidate `bio`, `website`, `email` **ONLY if currently NULL**
- Skips updates if wiki overrides exist (`bioWiki`, etc.)
- Creates `Engagement` record for completed surveys

**Output:**
- `scripts/import/ballotpedia-data.csv`
- Updates candidate profile fields (safe - only fills nulls)
- Creates survey completion engagements

---

### WRCG (West Richland Citizens Group)

Scrapes candidate questionnaires from the WRCG website (West Richland candidates only).

```bash
# Scrape WRCG (always outputs CSV)
npm run import:wrcg

# Review: scripts/import/wrcg-responses.csv

# Load to database (dry-run)
npm run import:wrcg:load

# Load to database (for real)
IMPORT_MODE=db npm run import:wrcg:load
```

**Requirements:**
- Playwright browsers installed
- `ANTHROPIC_API_KEY` in environment (for parsing questionnaire format)
- Database access

**Scope:**
- West Richland candidates only (~9 candidates in 2025)

**Special considerations:**
- Wix site requires conservative rate limiting (3s between pages)
- URL construction: `https://www.wrcg.org/{firstlast}` (lowercase, no spaces)

**Output:**
- `scripts/import/wrcg-responses.csv`
- Creates `Engagement` record for WRCG questionnaire
- Creates `CandidateEngagement` records for all West Richland candidates

---

### Legacy Scripts

**Letters to the Editor**

```bash
# Scrape new letters (incremental - checks for last processed)
npm run import:letters

# Review: scripts/import/letter-endorsements.csv

# Load to database
npm run import:letters:load
```

**PDC Contribution Data**

```bash
# Fast importer (recommended)
npm run import:pdc:fast 2025

# All years
npm run import:pdc:fast:all

# Legacy importer (slower, more verbose)
npm run import:pdc 2025
```

**Enforcement Cases**

```bash
# Full import
npm run import:enforcement

# Incremental (only new/updated)
npm run import:enforcement:incremental
```

---

## 🗂️ Data Model

All new importers use the `Engagement` and `CandidateEngagement` models:

### Engagement

Represents a single questionnaire, forum, survey, or community event.

```typescript
{
  id: string (cuid)
  slug: string (unique, deterministic)
  title: string
  date: DateTime?
  primaryLink: string?
  secondaryLink: string?
  secondaryLinkTitle: string?
  notes: string?
  raceId: string? (optional race filter)
}
```

### CandidateEngagement

Links candidates to engagements and tracks participation.

```typescript
{
  engagementId: string
  candidateId: string
  participated: boolean
  notes: string? (e.g., "Responded" or "Did not respond")
}
```

Composite primary key: `[engagementId, candidateId]`

---

## 🛠️ Shared Configuration

All new scripts import from `scripts/import/config.ts`:

- `IMPORT_MODE`: Feature flag for CSV vs DB mode
- `isDryRun()`: Check if in dry-run mode
- `getOutputMode()`: Get mode with user-friendly message
- `RATE_LIMITS`: Standard timing constants
- `EMOJI`: Consistent output vocabulary
- `escapeCsvField()`: CSV escaping helper
- `parseCsvLine()`: CSV parsing helper
- `generateEngagementSlug()`: Deterministic slug generation

---

## 📋 Best Practices

1. **Always review CSV output before database import**
   - Scraper scripts produce CSVs for manual review
   - Loader scripts default to dry-run mode

2. **Use environment variables for API keys**
   - Never commit API keys to git
   - Use `.env` file for local development

3. **Run scripts during off-peak hours**
   - Respect rate limits for external sites
   - PDC imports can take 10-30 minutes

4. **Check for duplicates before import**
   - Scripts use upsert patterns but review CSVs anyway

5. **Keep transcripts/PDFs in version control**
   - Transcripts are in `/transcripts`
   - PDFs should be downloaded to project root (add to `.gitignore` if large)

---

## 🐛 Troubleshooting

**"API key not found" errors:**
```bash
# Check .env file
cat .env | grep ANTHROPIC_API_KEY

# Or set directly
export ANTHROPIC_API_KEY=sk-ant-...
```

**"pdftotext not found":**
```bash
# macOS
brew install poppler

# Linux
apt-get install poppler-utils
```

**Playwright browser not installed:**
```bash
npx playwright install chromium
```

**CSV parsing errors:**
- Check for commas in text fields (should be quoted)
- Ensure no extra line breaks within quoted fields
- Use `parseCsvLine()` helper for robust parsing

**Rate limiting / timeouts:**
- Increase timeout values in script
- Add more delay between requests
- Some sites (Wix, Ballotpedia) need longer waits

---

## 📝 Adding New Import Scripts

When creating a new import script, follow this pattern:

1. **Create scraper script** (`scripts/import/source-scrape.ts`):
   - Use Playwright for web scraping OR
   - Use file system for local data OR
   - Use API client for structured data
   - Output to CSV with `scripts/import/source-data.csv`

2. **Create loader script** (`scripts/import/source-load.ts`):
   - Read CSV from scraper
   - Use `isDryRun()` to control DB writes
   - Create/update `Engagement` records
   - Create/update `CandidateEngagement` records
   - Output results CSV

3. **Add NPM scripts** to `package.json`:
   ```json
   "import:source": "ts-node --project tsconfig.scripts.json scripts/import/source-scrape.ts",
   "import:source:load": "ts-node --project tsconfig.scripts.json scripts/import/source-load.ts"
   ```

4. **Update documentation**:
   - Add section to this README
   - Update `ARCHITECTURE.md`
   - Update `CLAUDE.md` if adding new workflow

5. **Test thoroughly**:
   - Test scraper with 1-2 records
   - Review CSV output
   - Test loader in dry-run mode
   - Test loader with database writes
   - Verify data appears in UI

---

## 🔄 Import Workflow

Typical workflow for a new election cycle:

1. **Setup**
   ```bash
   npm run prepare:2025
   ```

2. **Import base data** (PDC filings, historical)
   ```bash
   npm run import:pdc:fast 2025
   npm run import:historical 2020 2021 2022 2023 2024
   ```

3. **Campaign phase** (run weekly/bi-weekly):
   ```bash
   npm run import:letters          # Daily during campaign
   npm run import:letters:load     # After reviewing CSV
   npm run import:pdc:fast 2025    # Weekly updates
   ```

4. **Late campaign** (September-October):
   ```bash
   # Scrape questionnaires (one-time)
   npm run import:tcrc
   npm run import:tcrc:load

   npm run import:ballotpedia
   npm run import:ballotpedia:load

   npm run import:wrcg
   npm run import:wrcg:load

   # Process video transcripts (as they become available)
   npm run import:tcrc:videos
   ```

5. **Post-election**:
   ```bash
   npm run import:results
   ```

---

## 📚 Related Documentation

- `ARCHITECTURE.md` - Overall system architecture
- `CLAUDE.md` - Project instructions and workflows
- `docs/spec-import-guides.md` - Detailed technical specifications
- `scripts/import/README-letters.md` - Legacy letters import docs

---

## ⚡ Quick Reference

```bash
# TCRC
npm run import:tcrc                           # Extract PDF questionnaire
npm run import:tcrc:load                      # Load (dry-run)
IMPORT_MODE=db npm run import:tcrc:load       # Load (database)
npm run import:tcrc:videos                    # Process video transcripts

# Ballotpedia
npm run import:ballotpedia                    # Scrape profiles
npm run import:ballotpedia:load               # Load (dry-run)
IMPORT_MODE=db npm run import:ballotpedia:load # Load (database)

# WRCG
npm run import:wrcg                           # Scrape questionnaires
npm run import:wrcg:load                      # Load (dry-run)
IMPORT_MODE=db npm run import:wrcg:load       # Load (database)

# Legacy
npm run import:letters                        # Scrape letters
npm run import:letters:load                   # Load letters
npm run import:pdc:fast 2025                  # Import contributions
npm run import:enforcement                    # Import PDC cases
```

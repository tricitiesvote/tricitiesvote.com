# PDC Candidate Scraper

This script automatically scrapes the Washington State Public Disclosure Commission (PDC) website to find candidate profiles and determine their filing status.

## What it does

For each 2025 candidate in the database, the script:

1. Searches for the candidate by name on the PDC candidate database
2. Finds their PDC profile URL (format: `https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/candidates/[ID]`)
3. Determines if they are a "mini filer" (simplified reporting requirements)
4. Updates the candidate record in the database with:
   - `pdc` field: The PDC profile URL
   - `minifiler` field: Boolean indicating mini filer status

## Usage

### Test Mode (First 3 Candidates Only)

```bash
npm run import:pdc:scrape:test
```

This processes only the first 3 candidates alphabetically. Use this to verify the script is working correctly before running on all candidates.

### Full Run (All 2025 Candidates)

```bash
npm run import:pdc:scrape              # Headless mode (no browser window)
npm run import:pdc:scrape:visible      # Visible browser (for debugging)
npm run import:pdc:scrape:fast         # Headless with 3 parallel browsers (fastest)
```

**Recommended:** Use `npm run import:pdc:scrape:fast` for production runs - it's 3x faster and runs headless.

## Technical Details

### How it works

1. **Browser Automation**: Uses Playwright to automate a real browser (headless mode available)
2. **Diacritic Handling**: Searches using ASCII version of names (Calixto Hernández → Calixto Hernandez) since PDC may not index with accents
3. **Search Method**: Uses the YADCF column filter on the PDC candidate table (`#yadcf-filter--candidates-table-0`)
4. **Year Selection**: When multiple election years exist for a candidate, it prefers the 2025 entry
5. **Region Verification**: Checks that the PDC page mentions the expected region (lenient matching)
6. **Mini Filer Detection**: Searches page text for keywords like "mini", "mini-filer", "minifiler"
7. **Parallel Processing**: Can run multiple browsers in parallel for faster processing

### Data Updated

For each candidate, the script updates:

```typescript
{
  pdc: string | null,        // Full PDC URL or null if not found
  minifiler: boolean         // true if candidate is a mini filer
}
```

### Performance

- **Single browser**: ~2-3 minutes for ~50 candidates
- **Parallel (3 browsers)**: ~1 minute for ~50 candidates (3x faster!)
- Rate limiting: 2-second delay between candidates per browser
- Headless mode: Faster and doesn't require display

### Error Handling

The script continues processing even if individual candidates fail. A summary is printed at the end showing:
- Total candidates processed
- Successfully found
- Mini filers count
- Not found count
- List of any errors

## Example Output

### Single Browser Mode
```
🔍 Starting PDC candidate scraper...
🤖 Running in headless mode
📊 Fetching 2025 candidates from database...
✅ Found 50 candidates to process

[1/50] Processing: Amanda Brown (Pasco)
  ℹ️  Found 2 entries (using 2025)
  ✅ PDC URL: https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/candidates/3321766
  📊 Mini Filer: No

[2/50] Processing: Calixto Hernández (Pasco)
  ✅ PDC URL: https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/candidates/3335342
  📊 Mini Filer: Yes
...
```

### Parallel Mode
```
🔍 Starting PDC candidate scraper...
🤖 Running in headless mode
⚡ Running 3 browsers in parallel
📊 Fetching 2025 candidates from database...
✅ Found 50 candidates to process

Split 50 candidates into 3 chunks

[Browser 1] [1/17] Processing: Amanda Brown (Pasco)
[Browser 2] [1/17] Processing: Bonnie Mitchell (Kennewick)
[Browser 3] [1/16] Processing: David Cole (Richland)
...

=== Summary ===
Total candidates: 50
Successfully found: 48
Mini filers: 15
Not found: 2
```

## Troubleshooting

### "No PDC profile found"

Some candidates may not have filed with the PDC yet, or may be using a different name variation. You can:
1. Manually search the PDC website for the candidate
2. Update the candidate's name in the database if it doesn't match their PDC filing
3. Manually set the PDC URL in the database if found

### Script timeout errors

The PDC website may be slow or unresponsive. You can:
1. Re-run the script (it will update existing records)
2. Increase timeout values in the script if needed

### Browser doesn't close

If the script crashes, you may need to manually close the browser window.

## Related Scripts

- `npm run import:pdc` - Import PDC contribution data (different from this scraper)
- `npm run import:pdc:fast` - Fast PDC contribution import
- `npm run import:pdc:all` - Import PDC contributions for all years

## See Also

- `scripts/import/pdc.ts` - PDC contribution import script
- `scripts/import/scrape-letters.ts` - Similar Playwright-based scraper for letters to the editor

# Utility Scripts

This directory contains utility scripts for managing election data.

## Available Utilities

### 🔍 fetch-race-ids.ts
Fetches race IDs from Washington State voter website for a given election.

```bash
# Fetch race IDs for the 2025 primary (election ID 893)
npx tsx scripts/utils/fetch-race-ids.ts 893

# Fetch race IDs for the 2025 general (election ID 894)
npx tsx scripts/utils/fetch-race-ids.ts 894
```

This script will:
- Query both Benton County (03) and Franklin County (11)
- Filter for Tri-Cities area races (Kennewick, Pasco, Richland, West Richland)
- Include Port districts (Benton, Kennewick, Pasco)
- Output race IDs in JSON format ready for config files

### 🔧 fix-office-types.ts
Fixes office types in the database based on office titles.

```bash
npx tsx scripts/utils/fix-office-types.ts
```

This ensures offices have the correct enum type:
- SCHOOL_BOARD for school districts
- PORT_COMMISSIONER for port positions
- MAYOR for mayoral races
- CITY_COUNCIL for council positions
- etc.

Run this after importing candidates if office types seem incorrect.

### 🔍 check-name-matches.ts
Checks for candidate name mismatches between different data sources.

```bash
# Check 2025 candidates
npx tsx scripts/utils/check-name-matches.ts 2025

# Check specific year
npx tsx scripts/utils/check-name-matches.ts 2023
```

This helps identify:
- All-caps names that need normalization
- Names with special characters
- Potential aliases needed for pamphlet import
- Suggests name mappings for `load-config-names.json`

## Workflow for New Elections

1. **Get Election IDs**
   - Find election ID from https://voter.votewa.gov/CandidateList.aspx
   - Primary elections are usually in August (odd years for municipal)
   - General elections are in November

2. **Fetch Race IDs**
   ```bash
   npx tsx scripts/utils/fetch-race-ids.ts [ELECTION_ID]
   ```

3. **Update Configuration**
   - Add race IDs to `legacy/data/json/load-config-election.json`
   - Update election ID and type (primary/general)

4. **Import Candidates from PDC**
   ```bash
   npm run import:pdc:fast 2025
   ```

5. **Fix Office Types**
   ```bash
   npx tsx scripts/utils/fix-office-types.ts
   ```

6. **Check Name Matches**
   ```bash
   npx tsx scripts/utils/check-name-matches.ts 2025
   ```

7. **Import Pamphlet Data**
   - Add any needed name aliases to the pamphlet import script
   - Run pamphlet import when available

## County Codes

- Benton County: `03`
- Franklin County: `11`

## Common Issues

### Names Not Matching
- Candidate names from PDC often differ from voter pamphlet
- Use `check-name-matches.ts` to identify mismatches
- Add aliases to pamphlet import script or `load-config-names.json`

### Missing Races
- Some races may not show candidates until filing deadline
- Port districts span counties - check both Benton and Franklin
- School districts may have at-large and district positions

### Office Type Errors
- Run `fix-office-types.ts` after any candidate import
- The script uses title keywords to determine correct type
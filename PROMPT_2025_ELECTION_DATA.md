# 2025 Election Data Setup - Task for Next Claude

## Context
The Tri-Cities Vote system is ready for the 2025 municipal election cycle. We've successfully migrated from Gatsby to Next.js, imported historical data (2020-2023), and fixed the UI to match the legacy system. Now we need to prepare for the 2025 election data.

## Current Status
- ✅ Database schema supports election years and types (PRIMARY, GENERAL, SPECIAL)
- ✅ Historical data imported (2020-2023)
- ✅ PDC import scripts working with correct field names
- ✅ UI displays data correctly with proper donor summaries
- ❌ 2025 data structures not yet created
- ❌ `scripts/prepare-2025.ts` referenced in package.json but doesn't exist

## Understanding the Election System

### Odd Years (2021, 2023, 2025) - Municipal Elections
- **Primary**: Usually August
- **General**: Usually November
- **4 City Guides**: Kennewick, Pasco, Richland, West Richland
- **Focus**: City Council, Mayor, School Board, Port Commissioner

### Even Years (2020, 2022, 2024) - County/State/Federal Elections
- **2 County Guides**: Benton County, Franklin County
- **Focus**: County Commissioner, State Legislature, Federal offices

## Required Tasks for 2025 Setup

### 1. Create the `prepare-2025.ts` Script
This script needs to:
- Create Region records for the 4 cities (if not exists)
- Create Office records for expected positions
- Create Guide records for each city
- Set up proper ElectionType (PRIMARY for August, GENERAL for November)

### 2. Obtain Election IDs from Washington State
- Contact VoteWA to get:
  - Election ID for 2025 Primary (August)
  - Election ID for 2025 General (November)
  - Race IDs for each contest

### 3. Update Configuration Files
Check and update:
- `legacy/data/json/load-config-names.json` - Candidate name mappings
- `legacy/data/json/load-config-election.json` - Election metadata

### 4. Implement Data Import Workflow
The typical workflow is:
1. **Pre-Election**: Import candidate filings from PDC
2. **Campaign Phase**: Regular PDC contribution updates
3. **Pamphlet Phase**: Import voter pamphlet when published
4. **Post-Election**: Import results and determine winners

## Key Questions to Investigate

1. **Primary vs General Election Handling**
   - How should we structure data for both primary and general?
   - Should races/candidates be duplicated or linked between primary/general?
   - Check how historical data handled this (look at 2021, 2023 data)

2. **Race and Office Creation**
   - Should offices be year-specific or shared across years?
   - How to handle positions that may or may not be up for election?

3. **Guide Structure**
   - Should we create separate guides for primary vs general?
   - Or one guide per city that includes both elections?

4. **Data Sources**
   - Verify PDC API endpoints for 2025 data availability
   - Check VoteWA pamphlet structure for changes
   - Confirm election results format hasn't changed

## Suggested Implementation Order

1. **First, investigate the existing pattern**:
   ```bash
   # Look at how 2023 (last municipal election) was structured
   npm run query "SELECT * FROM Guide WHERE electionYear = 2023"
   npm run query "SELECT DISTINCT type FROM Race WHERE electionYear = 2023"
   ```

2. **Create the prepare script**:
   - Copy pattern from historical imports
   - Ensure proper PRIMARY/GENERAL type assignment
   - Test with dry-run option first

3. **Test the import pipeline**:
   ```bash
   npm run prepare:2025
   npm run import:pdc 2025  # Should start finding candidate filings
   ```

## Important Notes
- The system uses `electionYear` not `year` in all database tables
- PDC uses `amount` not `contribution_amount` for donation amounts
- Municipal elections focus on city-level offices
- Always test imports on a backup database first

## Files to Review
- `scripts/migrate/migrate-all.ts` - Pattern for creating election data
- `scripts/import/pdc/*.ts` - PDC import logic
- `lib/wa-state/*` - Washington State data source integrations
- `prisma/schema.prisma` - Database structure

Good luck setting up the 2025 election data! The system is ready - it just needs the data structures and import configuration.
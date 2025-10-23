# Tri-Cities Vote Election Guide System

This project is currently being modernized from a Gatsby-based static site to a Next.js application with PostgreSQL database. This document describes the intended long-term architecture and business logic.

## CRITICAL: Design Philosophy

**This is a REARCHITECTURE, NOT a redesign.** The visual design, layout, and user experience must remain virtually identical to the original Gatsby site. The ONLY design change allowed is adding a year selector in the header to enable browsing historical election data.

### Design Principles:
1. **Preserve ALL original styling** - Every color, font, spacing, and visual element must match the legacy site
2. **Maintain exact layouts** - Component positioning, grid structures, and responsive behavior must be identical
3. **Keep interaction patterns** - All user interactions should work exactly as they did before
4. **Copy legacy CSS directly** - Use the original `legacy/gatsby/src/styles/global.css` without modification
5. **Match HTML structure** - Component hierarchy and class names should mirror the original

### What IS changing:
- **Backend architecture**: Moving from static site generation to dynamic Next.js with PostgreSQL
- **Data management**: Centralized database instead of JSON files
- **Year navigation**: Adding ability to browse different election years
- **Build process**: Modern Next.js tooling instead of Gatsby

### What is NOT changing:
- Visual appearance of any page
- Component layouts and styling
- Color scheme, typography, or spacing
- User workflows and interactions
- Information architecture (except for year navigation)

## Project Overview

The Tri-Cities Vote website provides nonpartisan voter guides for elections in the Tri-Cities region of Washington State (Kennewick, Pasco, Richland, and surrounding areas). The system manages candidate information, races, questionnaires, endorsements, and campaign finance data across multiple election cycles.

## Architecture

### Technology Stack
- **Frontend**: Next.js with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Content Management**: Decap CMS (formerly Netlify CMS) with Git-based workflow
- **Hosting**: Railway (database), Netlify (static site)
- **Data Sources**: Washington State PDC (campaign finance), VoteWA (election results)

### Core Data Model

The system is organized around these key entities:

**Regions** - Geographic areas that define voter guide boundaries:
- Municipal: Kennewick, Pasco, Richland, West Richland
- County: Benton County, Franklin County
- State/Federal: Walla Walla County (for state legislative districts)

**Offices** - Elected positions, dynamically created based on candidate data:
- Municipal: City Council, Mayor, School Board, Port Commissioner
- County: County Commissioner, Sheriff, Prosecutor, Superior Court Judge
- State: State Representative, State Senator
- Federal: US House, US Senate

**Races** - Specific contests for an office in a given year:
- Connected to an office and region
- Contains multiple candidates
- Has questionnaire responses and metadata
- Note: Uses `electionYear` field (not `year`)

**Candidates** - Individuals running for office:
- Profile information and photos
- Questionnaire responses
- Campaign finance data (via `donors` field)
- Election results
- Endorsements (separate table)
- Note: Uses `electionYear` field (not `year`)

**Guides** - Geographic groupings of races for voter convenience:
- Year-specific collections of relevant races
- Organized by location (city/county level)
- Note: Uses `electionYear` field (not `year`)

**Contributions** - PDC campaign finance records:
- Linked to candidates
- Individual donor records with amounts
- Used to generate donor summaries

**Endorsements** - Support/opposition from organizations:
- Linked to candidates
- FOR/AGAINST designation
- Organization type (ORG/LETTER)

### Election Cycle Logic

The guide system adapts to different types of elections:

**Odd Years (2021, 2023, 2025...)** - Municipal Elections
- **Guide Type**: 4 City Guides
- **Regions**: Kennewick, Pasco, Richland, West Richland
- **Focus Offices**: City Council, Mayor, School Board, Port Commissioner
- **Typical Pattern**: Local government and special districts

**Even Years (2020, 2022, 2024...)** - General Elections
- **Guide Type**: 2 County Guides  
- **Regions**: Benton County, Franklin County
- **Focus Offices**: County Commissioner, State Rep/Senator, Federal offices, Sheriff, Prosecutor
- **Typical Pattern**: County, state, and federal offices

### Year-Aware Navigation

The frontend supports browsing historical election data:
- URL structure: `/{year}/guide/{region}` 
- Year toggle in navigation allows switching between election cycles
- Each year maintains its appropriate guide structure (city vs county)
- All historical data preserved and accessible

## Business Logic Details

### Region Assignment Logic

**City-Level Races**: Assigned to the specific city
- Example: "Kennewick City Council" → Kennewick region

**County-Level Races**: Assigned based on geographic coverage
- Single county races → County region
- Multi-county races → Primary county region

**State Legislative Districts**:
- 16th District → Franklin County (primary coverage area)
- 8th/9th Districts → Benton County (primary coverage area)

**Federal Races**: Assigned to the county containing the largest population center

### Office Type Classification

The system uses dynamic office creation based on actual candidate data:

```typescript
enum OfficeType {
  CITY_COUNCIL
  SCHOOL_BOARD  
  PORT_COMMISSIONER
  COUNTY_COMMISSIONER
  STATE_SENATOR
  STATE_REPRESENTATIVE
  SUPERIOR_COURT_JUDGE
  US_HOUSE
  US_SENATE
  MAYOR
  SHERIFF
  PROSECUTOR
}
```

### Special Election Rules

**Richland Term Length Rules**: 
- Richland City Council has unique term length determination based on vote counts
- Top vote-getters receive longer terms
- System tracks results to automatically calculate term lengths

**Incumbent Detection**:
- Based on previous election results
- Automated when election results are imported
- Manual override capability for special appointments

### Data Integration Workflows

**Campaign Finance Data (PDC)**:
- Regular imports from Washington State Public Disclosure Commission
- Name normalization for matching candidates
- Contribution aggregation and analysis
- Donor pattern recognition

**Election Results**:
- Import from Washington State election results
- Candidate matching to existing database records
- Winner determination and incumbent status updates
- Term length calculations (especially Richland rules)

**Content Management**:
- Decap CMS for questionnaire management
- Git-based workflow for editorial review
- Photo and asset management
- Endorsement tracking

## Guide Generation Logic

### Dynamic Guide Creation

Guides are automatically generated based on:
1. **Year Type**: Odd (municipal) vs Even (county/state)
2. **Regional Relevance**: Which races affect each geographic area
3. **Office Coverage**: Ensuring all major offices are included
4. **Historical Patterns**: Maintaining consistency with past elections

### Race Inclusion Rules

**City Guides** (Odd Years):
- All races for offices within city boundaries
- School board races serving the city
- Port commissioner races (regional coverage)
- Relevant county/state races affecting city residents
- Explicitly include **Benton County City of West Richland Mayor** so external questionnaire sources (Vote411, WRCG) map cleanly to our database.

**County Guides** (Even Years):
- County-wide races (commissioner, sheriff, prosecutor)
- State legislative races covering the county
- Federal races
- Countywide judicial races
- Regional special districts

### Questionnaire System

**Office-Specific Questions**:
- City Council: Local issues, development, services
- School Board: Education policy, funding, curriculum
- County: Regional planning, law enforcement, infrastructure
- State: Legislative priorities, budget, state issues

**Response Processing**:
- Standardized response collection
- Editorial review workflow
- Public response tracking
- Non-response candidate flagging

## Data Import System

### Washington State Data Sources

The system integrates with several Washington State data sources through the `lib/wa-state` module:

**PDC (Public Disclosure Commission)**:
- API: `data.wa.gov` (Socrata platform)
- Data: Campaign contributions, expenditures, last-minute contributions
- Authentication: Requires API credentials for higher rate limits
- Script: `lib/wa-state/client.ts`
- **Note**: PDC candidate profile URLs use numeric IDs (e.g., `/candidates/3335342`) that are NOT available via API
  - Must be scraped from PDC website using `import:pdc:scrape` script
  - The API provides `filer_id` (e.g., `HERNC--024`) which is stored as `stateId` and used for contribution matching
  - Old URL format (`/candidate?filer_id=...`) is deprecated and no longer works

**VoteWA Voter Pamphlet**:
- URL: `voter.votewa.gov/elections/candidate.ashx`
- Data: Candidate statements, photos, contact information
- Requirements: Election ID and Race IDs for specific contests
- Script: `lib/wa-state/pamphlet.ts`

**Election Results**:
- URL: `results.vote.wa.gov/results/{year}{month}/{county}/`
- Data: Vote counts, percentages, winners
- Method: HTML scraping
- Script: `lib/wa-state/results.ts`

### Data Import Scripts

#### Core Import Commands

```bash
# Scrape PDC website for candidate profile URLs and mini filer status
npm run import:pdc:scrape:fast  # Headless, 3 parallel browsers (fastest, ~1 min)
npm run import:pdc:scrape       # Headless, single browser
npm run import:pdc:scrape:visible # Visible browser for debugging
npm run import:pdc:scrape:test  # Test on first 3 candidates

# Import campaign finance data from PDC (single year)
npm run import:pdc 2025

# Import all PDC data (2020-2025)
npm run import:pdc:all

# Fast PDC import (10-50x faster, batch operations)
npm run import:pdc:fast 2025
npm run import:pdc:fast:all

# Import historical data from Git branches
npm run import:historical 2020 2021 2022 2023

# Test historical import (dry-run)
npm run import:historical:test 2020

# Import candidate statements and photos from voter pamphlet
npm run import:pamphlet

# Import election results (after election)
npm run import:results

# Prepare database for new election year
npm run prepare:2025

# Import letters to the editor (endorsements)
npm run import:letters          # Scrape and analyze letters
npm run import:letters:load     # Load analyzed letters into database
```

#### Legacy Migration Commands

```bash
# Import all base data (candidates, races, offices)
npm run migrate:all-years

# Import specific year
npm run migrate:2023

# Validate imported data
npm run validate:2023
```

### 2025 Election Preparation

To prepare for the 2025 municipal election:

1. **Update Configuration Files**:
   - `legacy/data/json/load-config-names.json` - Add new candidate name mappings
   - `legacy/data/json/load-config-election.json` - Update election metadata

2. **Obtain Election IDs**:
   - Get Election ID from VoteWA for the 2025 election
   - Collect Race IDs for each contest (City Council, School Board, etc.)

3. **Run Import Sequence**:
   ```bash
   # 1. Set up base data structures
   npm run prepare:2025

   # 2. Bootstrap candidates from PDC API
   # This creates candidate records with stateId (filer_id) but NOT PDC URLs
   # (PDC URLs require web scraping in next step)
   # Run the appropriate script based on election year

   # 3. Scrape PDC website for profile URLs and mini filer status
   npm run import:pdc:scrape:fast
   # This uses Playwright to find the correct PDC profile URLs (numeric IDs)
   # and determine which candidates are mini filers

   # 4. Import campaign contribution data (ongoing during campaign)
   npm run import:pdc 2025

   # 5. Import pamphlet data (when available)
   npm run import:pamphlet

   # 6. Import results (after election)
   npm run import:results
   ```

### Letter to the Editor Endorsement Tracking

**Daily Workflow** (during campaign season):

The system automatically scrapes and analyzes Tri-City Herald letters to the editor to identify candidate endorsements or opposition.

**Process**:
1. **Scrape Letters**: Run `npm run import:letters`
   - Uses Playwright to fetch letters from https://www.tri-cityherald.com/opinion/letters-to-the-editor/
   - **Automatically detects last processed letter** from database
   - Only scrapes NEW letters since the last import (or since May 2025 on first run)
   - Extracts full text content from each letter
   - Uses Claude AI to analyze each letter for candidate mentions
   - Outputs results to `scripts/import/letter-endorsements.csv`
   - Separate file created for items needing manual review: `letter-endorsements-review.csv`

2. **Review Results**:
   - Check the CSV files for accuracy
   - AI categorizes mentions as: FOR, AGAINST, REVIEW, or IGNORE
   - Items marked REVIEW need human verification before import
   - Verify candidate name matches are correct (AI enforces exact full name matching)

3. **Import to Database**: Run `npm run import:letters:load`
   - Reads `letter-endorsements.csv`
   - Skips REVIEW and IGNORE items (manual review required)
   - Creates Endorsement records with type=LETTER
   - Automatically skips duplicates if letter already imported

**Important Notes**:
- Run this **DAILY** during the campaign (October-November)
- The AI is conservative - requires exact full name matches
- Letters are only scraped once (script checks for existing endorsements)
- Rate limited to 1 request/second to respect Herald's servers
- Requires `ANTHROPIC_API_KEY` environment variable

**Technical Details**:
- Script location: `scripts/import/scrape-letters.ts` and `import-letter-endorsements.ts`
- Uses Playwright for browser automation (bypasses site blocking)
- Claude AI analyzes text for endorsements
- Full documentation: `scripts/import/README-letters.md`

### Name Normalization System

The system includes sophisticated name matching to handle variations:
- `lib/normalize/names.ts` - Name normalization and fuzzy matching
- Handles nicknames, middle names, suffixes
- Configurable similarity thresholds
- Manual mapping overrides in configuration files

### Data Import Workflow Details

**Pre-Election Phase**:
1. Create Region, Office, and Guide records for the election year
2. Import candidate filing data from PDC
3. Match candidates to normalize names
4. Set up questionnaire system

**Campaign Phase**:
1. Regular PDC data imports (weekly/bi-weekly)
2. Import pamphlet data when published
3. Update candidate profiles and photos
4. Track endorsements and media coverage
5. **DAILY**: Import letters to the editor for endorsement tracking

**Post-Election Phase**:
1. Import official results
2. Determine winners and term lengths
3. Update incumbent status for next cycle
4. Archive completed election data

### Technical Requirements

**Environment Variables**:
```env
# Database connection (Railway PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"

# PDC API credentials (required for contribution imports)
SOCRATA_API_ID=your_api_id
SOCRATA_API_SECRET=your_api_secret

# Anthropic API credentials (required for letter scraping)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**TypeScript Configuration**:
- Data scripts use `tsconfig.scripts.json` (CommonJS, ES2022 target)
- Frontend uses standard `tsconfig.json` (ESNext modules)

### Troubleshooting Data Imports

**Common Issues**:
- **Name Matching**: Check `load-config-names.json` for missing mappings
- **API Rate Limits**: Add Socrata credentials to `.env`
- **Missing Race IDs**: Verify election configuration has all race IDs
- **Schema Mismatches**: Run `npx prisma migrate dev` after schema changes
- **PDC Field Names**: Use `amount` not `contribution_amount`, `receipt_date` not `contribution_date`
- **Database Connection**: Railway may rate-limit after heavy imports; wait or change IP

### Import Workflow Summary

1. **Base Data Import** (candidates, races, offices):
   ```bash
   npm run migrate:all-years
   ```

2. **Historical Data Import** (photos, endorsements, statements):
   ```bash
   npm run import:historical 2020 2021 2022 2023
   ```

3. **Questionnaire Imports**
   ```bash
   npm run import:wrcg          # West Richland Citizens Group responses
   npm run import:lowv          # Vote411 questionnaire via REST API
   IMPORT_MODE=db npm run import:wrcg:load
   IMPORT_MODE=db npm run import:lowv:load
   ```

4. **PDC Contribution Import** (campaign finance):
   ```bash
   npm run import:pdc:fast:all
   ```

4. **Verify Data**:
   - Check http://localhost:3000/[year]/guide/[region]
   - Ensure images display
   - Verify donor summaries show
   - Confirm endorsements appear

This architecture provides a flexible, maintainable system for managing election information across multiple cycles while preserving the simplicity and effectiveness of the original voter guide format.

## Current Implementation Status

### ✅ Completed
- Next.js app with year-aware routing
- Database schema with all core entities
- Historical data import (2020-2023)
- PDC contribution import with correct amounts
- Basic UI components matching legacy structure
- Endorsement display functionality

### 🚧 In Progress
- Donor data display on race/candidate pages
- CSS styling to match legacy exactly
- Markdown processing for bio/statement fields

### ❌ TODO
- VoteWA pamphlet import
- Election results import
- 2025 election preparation

## General Notes

- Do not use `git add -A` -- add files individually
- Keep all commit messages simple and one-line with NO Claude branding
- Database uses `electionYear` not `year` in all tables
- Railway database may rate-limit after heavy usage

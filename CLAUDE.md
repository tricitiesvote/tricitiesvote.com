# Tri-Cities Vote Election Guide System

This project is currently being modernized from a Gatsby-based static site to a Next.js application with PostgreSQL database. This document describes the intended long-term architecture and business logic.

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

**Candidates** - Individuals running for office:
- Profile information and photos
- Questionnaire responses
- Campaign finance data
- Election results

**Guides** - Geographic groupings of races for voter convenience:
- Year-specific collections of relevant races
- Organized by location (city/county level)

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

## Development Workflow

### Common Development Tasks

```bash
# Start development environment
npm run dev

# Database operations
npx prisma migrate dev      # Update schema
npx prisma studio          # Browse data
npm run db:seed            # Reset with base data

# Data import operations  
npm run migrate:all-years   # Import historical data
npm run import-pdc         # Update campaign finance data
npm run validate:2023      # Test data integrity

# Election cycle preparation
npm run prepare-year:2025   # Set up new election year
npm run import-results     # Process election results
```

### Content Update Cycle

1. **Pre-Election**: Set up races, recruit candidates, deploy questionnaires
2. **Campaign Season**: Regular PDC data updates, content management
3. **Election Night**: Results import and winner determination
4. **Post-Election**: Archive to historical data, prepare for next cycle

### Year Transition Process

1. **Data Preparation**: Create new year structure in database
2. **Guide Configuration**: Set up appropriate guide type (city vs county)
3. **Office Setup**: Create offices based on filed candidates
4. **Content Migration**: Adapt questionnaires for new races
5. **Testing**: Validate guide generation and navigation

This architecture provides a flexible, maintainable system for managing election information across multiple cycles while preserving the simplicity and effectiveness of the original voter guide format.
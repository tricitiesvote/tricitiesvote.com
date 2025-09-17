# Tri-Cities Vote Migration Handoff - PDC Data Display & UI Matching

## Context
We're migrating Tri-Cities Vote from a Gatsby-based static site to Next.js with PostgreSQL. All data has been successfully imported, but there are display issues with PDC donor data and significant UI differences from the legacy version.

## Current Status

### ✅ Completed
1. **Data Import**
   - Historical data (2020-2023): candidates, images, endorsements, statements
   - PDC contribution data with correct amounts (fixed field names from `contribution_amount` to `amount`)
   - Donor summaries generated in database

2. **Basic Functionality**
   - Year-aware routing works (`/[year]/guide/[region]`, `/[year]/race/[slug]`, `/[year]/candidate/[slug]`)
   - Database queries include endorsements
   - Parsing donor summary strings to fundraising objects in RaceCard component

### ❌ Issues to Fix

#### 1. PDC Data Display Issues

**Working:**
- Guide page (`/2023/guide/kennewick`) shows donor data correctly: "$14,950 from 21+ donors"

**Not Working:**
- Race page (`/2023/race/kennewick-city-council-pos-7`) shows "$0 from 0+ donors"
- Candidate detail page (`/2023/candidate/jim-millbauer`) shows "$0 from 0 unique donors"

**Root Cause:** The `donors` field is being parsed in RaceCard but not passed through to race/candidate pages properly.

#### 2. UI Does Not Match Legacy

**Current vs Legacy Screenshots:**

1. **Guide Page Comparison:**
   - Current: Simple cards with minimal styling
   - Legacy: Rich cards with:
     - Proper borders and shadows
     - Two-column layout with image on left
     - Endorsement badges (green pills with thumbs up)
     - Inline donor summary text
     - "View full profile »" link

2. **Candidate Detail Comparison:**
   - Current: Shows "$0 from 0 donors", missing donor details
   - Legacy: Shows full donor list with amounts, organized in two columns

## Key Files to Review

### Data Flow
1. `/lib/queries.ts` - Database queries (need to ensure `donors` field is included)
2. `/components/race/RaceCard.tsx` - Parses donor string correctly
3. `/app/[year]/race/[slug]/page.tsx` - Race page (not passing donor data)
4. `/app/[year]/candidate/[slug]/page.tsx` - Candidate page (not receiving donor data)

### Legacy CSS/Components to Match
1. `legacy/src/components/Candidate.js` - Original candidate card structure
2. `legacy/src/components/CandidateDonorSummary.js` - Donor display logic
3. `legacy/src/styles/global.css` - Original styling (especially `.candidate`, `.donor-summary`)

## Specific Tasks

### 1. Fix PDC Data Display
- Ensure queries in race/candidate pages include and parse the `donors` field
- Pass fundraising data through all component levels
- Display top donors list on candidate detail page (parse from contributions table)

### 2. Match Legacy UI Exactly
- Update candidate card HTML structure to match legacy
- Apply proper CSS Grid layout (two columns)
- Style endorsement badges as green pills with thumbs up emoji
- Fix typography and spacing to match
- Add proper borders, shadows, and hover states

### 3. Component Structure Fixes
```tsx
// Current structure is wrong
<CandidateMini> // or <Candidate>
  <div className="details">...</div>
  <div className="info">...</div>
</CandidateMini>

// Should match legacy structure
<div className="candidate">
  <div className="image">...</div>
  <div className="content">
    <h3>Name</h3>
    <div className="details">...</div>
    <div className="endorsements">...</div>
    <div className="donors">...</div>
  </div>
</div>
```

## Testing URLs
- Guide: http://localhost:3000/2023/guide/kennewick
- Race: http://localhost:3000/2023/race/kennewick-city-council-pos-7
- Candidate: http://localhost:3000/2023/candidate/jim-millbauer

## Success Criteria
1. All pages show correct donor amounts and counts
2. Candidate cards match legacy styling exactly
3. Endorsements display as green pill badges
4. Donor details list shows on candidate detail pages
5. Layout uses proper two-column grid structure

## Database Info
- Uses Railway PostgreSQL (connection in .env)
- Schema uses `electionYear` not `year`
- Contributions table has proper amounts
- `donors` field contains strings like "Reported raised $12500 from 156+ donors"
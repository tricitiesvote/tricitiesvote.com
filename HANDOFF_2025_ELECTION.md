# 2025 Election Data Import - Handoff Document

## Current Status (July 25, 2025)

The Tri-Cities Vote system has been successfully migrated from Gatsby to Next.js with PostgreSQL. We're currently importing data for the **2025 Primary Election (August 5, 2025)** - ballots are already in voters' hands!

### ✅ What's Been Completed

1. **Database Structure**
   - 3 city guides created (Kennewick, Pasco, Richland)
   - Note: West Richland is included under Richland region (this is intentional)
   - Office types fixed (SCHOOL_BOARD, PORT_COMMISSIONER, MAYOR properly assigned)

2. **Initial Candidate Import**
   - 17 candidates imported from PDC using `scripts/import/pdc-candidates-2025.ts`
   - 229 campaign contributions totaling ~$50k imported
   - 7 races created with proper relationships

3. **Election Configuration**
   - Election ID: **893** (2025 Primary)
   - PDC Dataset: **kv7h-kjye**
   - 25 race IDs identified and configured
   - Config files updated: `legacy/data/json/load-config-election.json`

4. **Partial Pamphlet Import**
   - Photos imported for 8 candidates (base64 → PNG files)
   - Email addresses and websites captured
   - Candidate statements imported (markdown converted from HTML)
   - Script: `scripts/import/pamphlet-2025.ts`

### ⚠️ Current Issues

1. **Missing Candidates**
   - Many candidates appear in voter pamphlet but not in our database
   - They likely haven't filed with PDC yet or have different names
   - Examples: Joshua Short, Tony Sanchez, Colin Michael, etc.

2. **Name Matching Problems**
   - "Tony Sanchez" in pamphlet vs "Anthony E Sanchez" in database
   - "Donald Landsman" in pamphlet vs "LANDSMAN DONALD C" in database
   - Need to add more name aliases

3. **Missing Pasco Races**
   - No Pasco City Council or School Board candidates imported yet
   - They exist in the pamphlet data but not in PDC

## Key Files & Scripts

### Import Scripts
- `scripts/import/pdc-candidates-2025.ts` - Imports candidates from PDC
- `scripts/import/pamphlet-2025.ts` - Imports photos/statements from voter pamphlet
- `scripts/import/pdc-fast.ts` - Fast contribution import

### Configuration
- `legacy/data/json/load-config-election.json` - Election IDs and race IDs
- `legacy/data/json/load-config-names.json` - Name mappings for normalization

### Data Sources
- **PDC API**: `https://data.wa.gov/resource/kv7h-kjye.json`
- **Voter Pamphlet**: `https://voter.votewa.gov/elections/candidate.ashx?e=893&r={raceId}`
- **Candidate List**: `https://voter.votewa.gov/CandidateList.aspx?e=893`

## Next Steps for Completion

### 1. Import Missing Candidates
```bash
# Check for new candidates in PDC
curl -s "https://data.wa.gov/resource/kv7h-kjye.json?election_year=2025&jurisdiction_county=FRANKLIN" | jq

# Or create them manually from pamphlet data
```

### 2. Fix Name Matching
Add more aliases to `scripts/import/pamphlet-2025.ts`:
```typescript
nameMatcher.addAlias('EXISTING_NAME', 'PAMPHLET_NAME')
```

### 3. Complete Pamphlet Import
```bash
# Run pamphlet import again after fixing names
npm run import:pamphlet-2025

# Or use the legacy pamphlet import approach
npm run import:pamphlet
```

### 4. Import Missing Races
Check Franklin County for Pasco races:
```bash
curl -s "https://voter.votewa.gov/CandidateList.aspx?e=893&c=11" | grep -i pasco
```

### 5. Verify All Data
- Check each city guide has all expected races
- Ensure all candidates have photos/statements
- Verify donor summaries are showing

## Important Context

### Database Schema
- Uses `electionYear` not `year` in all tables
- Candidates linked to offices, which are linked to regions
- Races connect candidates to specific elections
- Guide table groups races by geographic area

### Race IDs for 2025 Primary
```json
[
  "162487", // Kennewick Ward District #2
  "162488", // City Of Richland - Council Pos. 7
  "162489", // City Of West Richland - Mayor
  "162490", // City Of West Richland - Council Pos. 3
  "162491", // Kennewick Public Hospital District
  "162493", // Richland School District 400
  "162505", // Port Of Kennewick-Dist 2
  "162506", // Kennewick School District 17
  "162583", // Kennewick Ward District #1
  "162584", // City Of West Richland - Council Pos. 2
  "162602", // Kennewick Ward District #3
  "162603", // City Of Kennewick - Council Position 4
  "162604", // City Of West Richland - Council Pos. 1
  "162605", // City Of West Richland - Council Pos. 4
  "162607", // Kennewick Public Hospital District
  "162621", // City Of Richland - Council Pos. 3
  "162622", // City Of Richland - Council Pos. 6
  "162623", // City Of Richland - Council Pos. 4
  "162625", // Kennewick Public Hospital District
  "162682", // Richland School District 400
  "164278", // Port of Benton-Dist 1
  "164279", // Kennewick School District 17
  "164351", // Pasco Port District 3
  "165057", // Pasco Port District 2
  "165654"  // Kennewick Public Hospital District
]
```

### Common Commands
```bash
# Start dev server
npm run dev

# Import PDC contributions
npm run import:pdc:fast 2025

# Check database
npx prisma studio

# View site
http://localhost:3000/2025/guide/kennewick
```

## Debugging Tips

1. **Missing candidates**: Check PDC with exact name variations
2. **No photos**: Verify `HasPhoto: true` in pamphlet data
3. **Wrong office**: Check `inferRegionFromOffice` logic
4. **Import failures**: Check Railway database connection limits

## Final Goal

Complete voter guide for 2025 Primary with:
- All candidates with photos and statements
- Complete donor information
- All races properly categorized
- Working navigation between city guides

Good luck! The system is working well - just needs the remaining data imported.
# 2025 Election Setup Guide

## Current Status ✅

The system is now ready for the 2025 municipal election data:

1. **Database Structure**: 
   - 3 Guides created (Kennewick, Pasco, Richland)
   - All expected offices created with correct types
   - Office types fixed (SCHOOL_BOARD, PORT_COMMISSIONER, MAYOR properly assigned)

2. **Import Scripts**:
   - `prepare-2025.ts` script created and tested
   - PDC import tested and working (awaiting candidate filings)
   - Fast import confirmed to work for 2025 data

## Immediate Next Steps 🚀

### 1. Obtain Election IDs (CRITICAL)

Contact Washington State elections to get:
- **Election ID** for 2025 Municipal Primary (August)
- **Election ID** for 2025 Municipal General (November)
- **Race IDs** for each contest

Resources:
- VoteWA: https://voter.votewa.gov
- Contact: elections@sos.wa.gov

### 2. Update Configuration Files

Once you have the election IDs:

```bash
# Copy the template
cp legacy/data/json/load-config-election-2025-template.json legacy/data/json/load-config-election.json

# Edit with actual values
# - pdcDataset: Get from https://data.wa.gov (search "2025 Campaign Finance")
# - electionId: From VoteWA
# - raceIds: Array of race IDs from VoteWA
```

### 3. Monitor Candidate Filings

Starting in early 2025, run weekly:

```bash
# Import new candidate filings
npm run import:pdc:fast 2025

# Check for new candidates
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.candidate.count({ where: { electionYear: 2025 } })
  .then(count => console.log(\`2025 Candidates: \${count}\`))
  .finally(() => prisma.\$disconnect());
"
```

## Election Timeline 📅

### Phase 1: Pre-Filing (January - April 2025)
- [ ] Obtain election IDs from VoteWA
- [ ] Update configuration files
- [ ] Test import pipelines

### Phase 2: Filing Period (May 2025)
- [ ] Daily PDC imports during filing week
- [ ] Verify candidate office assignments
- [ ] Update name mappings as needed

### Phase 3: Campaign Period (June - October 2025)
- [ ] Weekly PDC contribution updates
- [ ] Import voter pamphlet when published (usually July)
- [ ] Track endorsements

### Phase 4: Post-Election (November 2025)
- [ ] Import election results
- [ ] Determine winners
- [ ] Calculate Richland term lengths (special rules)
- [ ] Update incumbent status

## Import Commands Reference 📝

```bash
# Prepare database for 2025 (already done)
npm run prepare:2025

# Import PDC data (run regularly)
npm run import:pdc:fast 2025

# Import voter pamphlet (when available)
npm run import:pamphlet

# Import election results (after election)
npm run import:results

# Update name mappings
# Edit: legacy/data/json/load-config-names.json
```

## Troubleshooting 🔧

### No candidates appearing?
- Candidates haven't filed yet (check PDC website)
- Name mapping issues (check load-config-names.json)
- Wrong office assignment (verify office titles match exactly)

### PDC import errors?
- Check API credentials in .env file
- Verify pdcDataset ID is correct for 2025
- Rate limiting: wait and retry

### Missing regions/offices?
- West Richland is included under Richland region (this is intentional)
- Port commissioners may span multiple regions
- Run `npm run prepare:2025` again if needed

## Database Queries for Monitoring 🔍

```sql
-- Check 2025 guides
SELECT g.*, r.name as region_name 
FROM "Guide" g 
JOIN "Region" r ON g."regionId" = r.id 
WHERE g."electionYear" = 2025;

-- Check 2025 candidates
SELECT c.name, o.title, r.name as region
FROM "Candidate" c
JOIN "Office" o ON c."officeId" = o.id
JOIN "Region" r ON o."regionId" = r.id
WHERE c."electionYear" = 2025;

-- Check contribution totals
SELECT c.name, COUNT(con.*) as contributions, SUM(con.amount) as total
FROM "Candidate" c
LEFT JOIN "Contribution" con ON c.id = con."candidateId"
WHERE c."electionYear" = 2025
GROUP BY c.id, c.name;
```

## Contact for Help 📧

- Technical issues: Check Railway logs and database connection
- Election data: elections@sos.wa.gov
- PDC data: pdc@pdc.wa.gov

Good luck with the 2025 election cycle! 🗳️
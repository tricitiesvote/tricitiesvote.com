# Data Import Utilities

This directory contains reusable utilities for managing election data imports and fixes.

## Available Utilities

### 1. Fix Candidate Offices
```bash
npx tsx scripts/utils/fix-candidate-offices.ts [year]
```
Reassigns candidates to their correct offices when they've been imported with incorrect assignments.

### 2. Match Pamphlet Candidates
```bash
npx tsx scripts/utils/match-pamphlet-candidates.ts [year] [--auto]
```
Helps match unmatched pamphlet candidates to existing database records.

### 3. Validate Race IDs
```bash
npx tsx scripts/utils/validate-race-ids.ts [electionId]
```
Validates which race IDs have pamphlet data available.

### 4. Find Duplicate Candidates
```bash
npx tsx scripts/utils/find-duplicates.ts [year]
```
Finds potential duplicate candidates based on name similarity.

### 5. Import Missing Candidates
```bash
npx tsx scripts/utils/import-missing-candidates.ts [year]
```
Imports candidates that exist in pamphlet but not in database.

### 6. Fix Name Mappings
```bash
npx tsx scripts/utils/fix-name-mappings.ts
```
Updates name mapping configuration based on common mismatches.

## Common Issues These Scripts Solve

1. **Wrong Office Assignment**: When PDC or pamphlet import assigns candidates to generic "Unknown Office"
2. **Name Mismatches**: When pamphlet names don't match PDC names exactly
3. **Missing Candidates**: When candidates appear in pamphlet but not in PDC data
4. **Duplicate Records**: When same candidate imported multiple times with name variations
5. **Missing Photos/Statements**: When pamphlet data exists but wasn
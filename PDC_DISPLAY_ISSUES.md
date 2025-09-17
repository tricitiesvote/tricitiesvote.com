# PDC Data Display Issues Analysis

## Overview
While the PDC contribution data has been successfully imported into the database (13,728 records), it's not displaying properly in the interface. This document outlines the issues and required fixes.

## Issues Identified

### 1. Missing Donor Information Display
**Original (working):**
- Shows detailed donor information: "$8,950 from 23+ donors, including Plumbers Steamfitters Local Union 598 Pac ($1200)..."
- Lists top donors with amounts
- Shows links to "See full candidate details »"

**New (broken):**
- Shows only "$0 from 0+ donors"
- No donor details displayed
- The data exists in the database but isn't being shown

### 2. Layout Issues with Candidate Cards
**Original (working):**
- Clean two-column layout
- Candidate image on left, info on right
- Proper spacing and alignment
- Sections clearly separated: Experience, Endorsements, Donors

**New (broken):**
- Text wrapping incorrectly
- Experience section overflowing
- Poor spacing between sections
- Information appears jumbled together

### 3. Contribution Amount Issue
The SQL analysis shows that all contribution amounts in the database are $0.00. This indicates the PDC import script is not properly parsing the `contribution_amount` field from the API.

## Root Causes

### 1. PDC Import Script Issues
```typescript
// Current code in scripts/import/pdc.ts
amount: parseFloat(contribution.contribution_amount) || 0,
```

The `parseFloat()` is failing and defaulting to 0. Possible reasons:
- The amount field might be formatted with currency symbols (e.g., "$1,200.00")
- The field name might be different than expected
- The data might need cleaning before parsing

### 2. Missing Donor Summary Logic
The candidate cards are showing "$0 from 0+ donors" because:
- The donor summary field isn't being populated correctly
- The frontend might not be reading the `donors` field properly
- The calculation logic in `updateCandidateDonorSummaries` might have issues

### 3. CSS Layout Problems
The layout issues stem from:
- Missing or incorrect CSS grid implementation
- The HTML structure not matching the legacy exactly
- Possible missing wrapper divs or incorrect class names

## Required Fixes

### 1. Fix PDC Amount Parsing
```typescript
// Need to update the amount parsing logic
const cleanAmount = contribution.contribution_amount
  ?.replace(/[$,]/g, '') // Remove $ and commas
  ?.trim() || '0';
amount: parseFloat(cleanAmount) || 0,
```

### 2. Debug Donor Summary Generation
- Check if the `donors` field is being populated in the database
- Verify the frontend is reading the correct field
- Add logging to see what's being calculated

### 3. Fix CSS Layout
- Compare the exact HTML structure from legacy
- Ensure proper CSS Grid implementation
- Fix the candidate card layout to match original

### 4. Add Data Validation
- Log sample contribution data to see actual field values
- Add validation to ensure amounts are parsed correctly
- Include error handling for malformed data

## Next Steps

1. **Immediate**: Fix the contribution amount parsing in the PDC import script
2. **Re-run Import**: Use the fast import script to re-import with correct amounts
3. **Fix Layout**: Update CSS to match legacy grid layout exactly
4. **Verify Display**: Ensure donor information displays correctly in the UI
5. **Test**: Verify all years show correct donor summaries

## Sample Data Check Needed
We need to log actual contribution data from the API to see the exact format:
```typescript
console.log('Sample contribution:', JSON.stringify(contribution, null, 2));
```

This will help identify the correct field names and formats for parsing.
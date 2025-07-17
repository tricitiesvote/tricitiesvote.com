# Frontend Migration Plan: Gatsby to Next.js

## Overview

This document outlines the complete migration strategy from the legacy Gatsby site to a modern Next.js application while preserving 100% of the current design and adding year-aware functionality.

**Context**: The historical data migration has been completed - 145 candidates across 4 years (2020-2023) have been successfully imported from Git branches into PostgreSQL with 54 offices, 7 regions, and 8 geographic guides. The database schema is ready and contains all historical election data. The legacy Gatsby site code is preserved in the `legacy/` directory for reference.

## Design Requirements

1. **Preserve Exact Current Design**: Maintain all existing styling, layouts, and visual elements
2. **Year Toggle Navigation**: Add year selector in top menu for viewing different election years
3. **Dynamic Guide System**: 
   - Odd years (2021, 2023, etc.) = 4 city guides (Kennewick, Pasco, Richland, West Richland)
   - Even years (2020, 2022, etc.) = 2 county guides (Benton County, Franklin County)

## Project Architecture

### Year-Aware Routing Structure
```
/                           # Homepage - defaults to latest year
/[year]                     # Year-specific homepage (e.g., /2023)
/[year]/guide/[region]      # Regional guides (e.g., /2023/guide/kennewick)
/[year]/candidate/[slug]    # Candidate pages (e.g., /2023/candidate/john-doe)
/[year]/race/[slug]         # Race pages (e.g., /2023/race/kennewick-city-council)
/about                      # Static pages (year-agnostic)
/thanks
```

### Next.js Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout with YearToggle
│   ├── page.tsx                # Homepage (latest year)
│   ├── [year]/
│   │   ├── layout.tsx          # Year-specific layout
│   │   ├── page.tsx            # Year homepage
│   │   ├── guide/
│   │   │   └── [region]/
│   │   │       └── page.tsx    # Regional guide pages
│   │   ├── candidate/
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Candidate pages
│   │   └── race/
│   │       └── [slug]/
│   │           └── page.tsx    # Race pages
│   ├── about/
│   │   └── page.tsx            # Static pages
│   └── api/                    # API routes for data
├── components/
│   ├── YearToggle.tsx          # Year selector component
│   ├── GuideSelector.tsx       # City vs County guide selector
│   ├── layout/
│   │   ├── Header.tsx          # Main navigation
│   │   └── Footer.tsx
│   ├── candidate/
│   │   ├── CandidateCard.tsx   # Migrated from legacy
│   │   ├── CandidateProfile.tsx
│   │   └── CompareTable.tsx
│   └── race/
│       ├── RaceOverview.tsx
│       └── RaceCard.tsx
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── queries.ts              # Database query functions
│   └── utils.ts                # Helper functions
└── styles/
    └── globals.css             # Migrated legacy styles
```

## Guide System Logic

### Election Year Types
- **Odd Years (2021, 2023, 2025...)** - Municipal Elections
  - 4 City Guides: Kennewick, Pasco, Richland, West Richland
  - Focus on: City Council, Mayor, School Board, Port Commissioner

- **Even Years (2020, 2022, 2024...)** - County/State Elections  
  - 2 County Guides: Benton County, Franklin County
  - Focus on: County Commissioner, State Rep/Senator, Federal offices

### Guide Logic Implementation
```typescript
// lib/utils.ts
export function getYearType(year: number): 'municipal' | 'county' {
  return year % 2 === 1 ? 'municipal' : 'county'
}

export function getGuideRegionsForYear(year: number): string[] {
  const yearType = getYearType(year)
  return yearType === 'municipal' 
    ? ['Kennewick', 'Pasco', 'Richland', 'West Richland']
    : ['Benton County', 'Franklin County']
}
```

## Implementation Phases

### Phase 1: Core Architecture Setup

**Tasks:**
1. Initialize Next.js 14+ project with App Router
2. Set up Prisma database connection
3. Create basic project structure
4. Configure TypeScript and ESLint

**Key Files:**
- `package.json` - Dependencies and scripts (extend existing one)
- `next.config.js` - Next.js configuration  
- `tsconfig.json` - TypeScript configuration (update existing one)
- `src/lib/db.ts` - Prisma client setup (import from existing schema)

**Available Migration Scripts:**
- `npm run migrate:all-years` - Re-import all historical data if needed
- `npm run validate:2023` - Test data relationships
- Existing Prisma client can be imported from `@prisma/client`

### Phase 2: Data Layer Implementation

**Database Query Functions:**
```typescript
// lib/queries.ts
export async function getAvailableYears(): Promise<number[]> {
  const races = await prisma.race.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  })
  return races.map(r => r.year)
}

export async function getGuidesForYear(year: number): Promise<Guide[]> {
  return await prisma.guide.findMany({
    where: { year },
    include: {
      races: {
        include: {
          office: true,
          candidates: true
        }
      }
    }
  })
}

export async function getGuideByYearAndRegion(year: number, regionSlug: string): Promise<Guide> {
  const region = await prisma.region.findFirst({
    where: { 
      name: { contains: regionSlug, mode: 'insensitive' }
    }
  })
  
  return await prisma.guide.findFirst({
    where: { 
      year,
      regionId: region?.id
    },
    include: {
      races: {
        include: {
          office: true,
          candidates: true
        }
      }
    }
  })
}
```

### Phase 3: Core Components

**Year Toggle Component:**
```tsx
// components/YearToggle.tsx
'use client'
import { usePathname, useRouter } from 'next/navigation'

interface YearToggleProps {
  currentYear: number
  availableYears: number[]
}

export function YearToggle({ currentYear, availableYears }: YearToggleProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  const switchYear = (newYear: number) => {
    // Replace current year in path with new year
    const pathSegments = pathname.split('/')
    const yearIndex = pathSegments.findIndex(segment => segment === currentYear.toString())
    
    if (yearIndex > -1) {
      pathSegments[yearIndex] = newYear.toString()
      const newPath = pathSegments.join('/')
      router.push(newPath)
    } else {
      // If no year in path, add it
      router.push(`/${newYear}`)
    }
  }
  
  return (
    <div className="year-toggle">
      <label htmlFor="year-select">Election Year:</label>
      <select 
        id="year-select"
        value={currentYear} 
        onChange={(e) => switchYear(parseInt(e.target.value))}
        className="year-selector"
      >
        {availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  )
}
```

**Guide Selector Component:**
```tsx
// components/GuideSelector.tsx
import Link from 'next/link'
import { getYearType, getGuideRegionsForYear } from '@/lib/utils'

interface GuideSelectorProps {
  year: number
  currentRegion?: string
}

export function GuideSelector({ year, currentRegion }: GuideSelectorProps) {
  const yearType = getYearType(year)
  const regions = getGuideRegionsForYear(year)
  
  return (
    <nav className="guide-selector">
      <h2>{yearType === 'municipal' ? 'City Guides' : 'County Guides'}</h2>
      <ul className="guide-list">
        {regions.map(region => {
          const slug = region.toLowerCase().replace(/ /g, '-')
          const isActive = currentRegion === slug
          
          return (
            <li key={region}>
              <Link 
                href={`/${year}/guide/${slug}`}
                className={isActive ? 'active' : ''}
              >
                {region}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

### Phase 4: Page Implementation

**Dynamic Year Homepage:**
```tsx
// app/[year]/page.tsx
import { getGuidesForYear, getAvailableYears } from '@/lib/queries'
import { getYearType } from '@/lib/utils'
import { GuideSelector } from '@/components/GuideSelector'
import { YearToggle } from '@/components/YearToggle'

interface YearHomePageProps {
  params: { year: string }
}

export default async function YearHomePage({ params }: YearHomePageProps) {
  const year = parseInt(params.year)
  const guides = await getGuidesForYear(year)
  const availableYears = await getAvailableYears()
  const yearType = getYearType(year)
  
  return (
    <div className="year-homepage">
      <header>
        <h1>{year} {yearType === 'municipal' ? 'Municipal' : 'General'} Election Guide</h1>
        <YearToggle currentYear={year} availableYears={availableYears} />
      </header>
      
      <GuideSelector year={year} />
      
      <main>
        <div className="guides-overview">
          {guides.map(guide => (
            <div key={guide.id} className="guide-preview">
              <h3>{guide.title}</h3>
              <p>{guide.races.length} races</p>
              <Link href={`/${year}/guide/${guide.region.name.toLowerCase().replace(/ /g, '-')}`}>
                View Guide →
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
```

**Regional Guide Pages:**
```tsx
// app/[year]/guide/[region]/page.tsx
import { getGuideByYearAndRegion, getAvailableYears } from '@/lib/queries'
import { GuideSelector } from '@/components/GuideSelector'
import { RaceCard } from '@/components/race/RaceCard'

interface RegionalGuidePageProps {
  params: { 
    year: string
    region: string 
  }
}

export default async function RegionalGuidePage({ params }: RegionalGuidePageProps) {
  const year = parseInt(params.year)
  const regionSlug = params.region
  
  const guide = await getGuideByYearAndRegion(year, regionSlug)
  const availableYears = await getAvailableYears()
  
  if (!guide) {
    return <div>Guide not found</div>
  }
  
  return (
    <div className="regional-guide">
      <header>
        <h1>{guide.title}</h1>
        <GuideSelector year={year} currentRegion={regionSlug} />
      </header>
      
      <main>
        <div className="races-list">
          {guide.races.map(race => (
            <RaceCard key={race.id} race={race} year={year} />
          ))}
        </div>
      </main>
    </div>
  )
}
```

### Phase 5: Legacy Component Migration

**Preserve Exact CSS Styling:**
1. Copy `legacy/gatsby/src/styles/global.css` to `src/styles/globals.css`
2. Maintain all existing class names and design (documented in legacy analysis)
3. Add minimal new styles only for year toggle and guide selector
4. Key design elements: Avenir Next font, `#02BEE8` brand color, minimalist aesthetic

**Component Migration Priority:**
1. **Layout Components** - Header, Footer, basic structure
2. **Candidate Components** - CandidateCard, CandidateProfile, CompareTable
3. **Race Components** - RaceCard, RaceOverview  
4. **Interactive Components** - Questionnaire display, comparison tools

**Legacy Component Locations:**
- Components: `legacy/gatsby/src/components/`
- Styles: `legacy/gatsby/src/styles/global.css`
- Pages: `legacy/gatsby/src/pages/` and `legacy/gatsby/src/templates/`
- Helpers: `legacy/gatsby/src/helpers/`

**CompareTable Migration Example:**
```tsx
// components/candidate/CompareTable.tsx
// Migrate from legacy/gatsby/src/components/CompareTable.js
// Preserve all existing functionality and styling
// Add year context for data fetching
```

### Phase 6: Static Pages and SEO

**Static Pages:**
- `/about` - About the project
- `/thanks` - Thank you page
- `/404` - Error page

**SEO Implementation:**
- Meta tags for each page type
- Open Graph images for social sharing
- Structured data for candidates and races

## Data Migration Strategy

### Database Integration
- Use existing PostgreSQL database with migrated historical data (Railway hosted)
- Database schema is at `prisma/schema.prisma` 
- Query through Prisma ORM in server components
- Implement caching for performance
- Connection details in `.env` file (DATABASE_URL)

### URL Structure Migration
```
Legacy Gatsby → New Next.js
/               → /2023 (latest year)
/kennewick      → /2023/guide/kennewick
/candidate-name → /2023/candidate/candidate-name
/race-name      → /2023/race/race-name
```

## Technical Decisions

1. **App Router**: Use Next.js 13+ App Router for better nested layouts and server components
2. **Server Components**: Leverage for database queries and SEO benefits
3. **Client Components**: Use sparingly, only for interactive elements
4. **Static Generation**: Pre-generate pages for all years where possible
5. **Database Queries**: Direct Prisma queries in server components
6. **Styling**: Preserve existing CSS approach, avoid CSS-in-JS for consistency

## Performance Considerations

1. **Static Generation**: Generate pages for all historical years
2. **Image Optimization**: Use Next.js Image component
3. **Database Queries**: Optimize with proper indexing and caching
4. **Bundle Size**: Code splitting by year/region
5. **SEO**: Server-side rendering for all content

## Migration Benefits

1. **Enhanced UX**: Easy year switching while maintaining exact design
2. **Better Data Management**: Centralized database vs scattered JSON files  
3. **Improved Performance**: Next.js optimizations vs Gatsby build times
4. **Flexibility**: Easy to add new years without rebuilding entire site
5. **Maintainability**: Clean separation of concerns and modern React patterns

## Timeline and Milestones

### Week 1: Setup and Foundation
- [ ] Initialize Next.js project
- [ ] Set up database connection
- [ ] Create basic routing structure
- [ ] Migrate global styles

### Week 2: Core Components
- [ ] Implement YearToggle component
- [ ] Build GuideSelector component
- [ ] Create layout components
- [ ] Set up year-aware data queries

### Week 3: Page Implementation
- [ ] Build homepage and year pages
- [ ] Implement regional guide pages
- [ ] Create candidate profile pages
- [ ] Add race overview pages

### Week 4: Legacy Component Migration
- [ ] Migrate comparison tables
- [ ] Port candidate cards and profiles
- [ ] Implement questionnaire display
- [ ] Add search and filtering

### Week 5: Polish and Testing
- [ ] SEO optimization
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Accessibility audit

This plan preserves 100% of the current design while modernizing the tech stack and adding powerful year-switching functionality based on our existing database structure.
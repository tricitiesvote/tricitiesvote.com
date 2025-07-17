import Link from 'next/link'
import { getYearType, getGuideRegionsForYear, slugify } from '@/lib/utils'

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
          const slug = slugify(region)
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
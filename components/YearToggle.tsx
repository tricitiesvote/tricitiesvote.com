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
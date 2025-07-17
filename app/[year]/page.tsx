import { getGuidesForYear, getAvailableYears } from '@/lib/queries'
import { getYearType } from '@/lib/utils'
import { GuideSelector } from '@/components/GuideSelector'
import Link from 'next/link'

interface YearHomePageProps {
  params: { year: string }
}

export default async function YearHomePage({ params }: YearHomePageProps) {
  const year = parseInt(params.year)
  const guides = await getGuidesForYear(year)
  const yearType = getYearType(year)
  
  return (
    <div className="year-homepage">
      <header className="page-header">
        <h1>{year} {yearType === 'municipal' ? 'Municipal' : 'General'} Election Guide</h1>
      </header>
      
      <GuideSelector year={year} />
      
      <main>
        <div className="guides-overview">
          {guides.map(guide => {
            const regionSlug = guide.region.name.toLowerCase().replace(/\s+/g, '-')
            return (
              <div key={guide.id} className="guide-preview">
                <h3>{guide.title}</h3>
                <p>{guide.races.length} races</p>
                <Link href={`/${year}/guide/${regionSlug}`}>
                  View Guide →
                </Link>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
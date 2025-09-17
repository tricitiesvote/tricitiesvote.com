import { getGuidesForYear, getAvailableYears } from '@/lib/queries'
import { getYearType, slugify } from '@/lib/utils'
import { GuideSelector } from '@/components/GuideSelector'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface YearHomePageProps {
  params: { year: string }
}

export default async function YearHomePage({ params }: YearHomePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }
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
          {guides.length === 0 ? (
            <p className="guide-empty">Guides N/A for this year.</p>
          ) : (
            guides.map(guide => {
              const regionSlug = slugify(guide.region.name)
              return (
                <div key={guide.id} className="guide-preview">
                  <h3>{guide.region.name} Guide</h3>
                  <p>{guide.Race.length} races</p>
                  <Link href={`/${year}/guide/${regionSlug}`}>
                    View Guide →
                  </Link>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

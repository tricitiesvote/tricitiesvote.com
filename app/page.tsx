import { cache } from 'react'
import { ContactInline } from '@/components/ContactInline'
import { HowToUseThisGuide } from '@/components/home/HowToUseThisGuide'
import { getAvailableYears, getGuidesForYear } from '@/lib/queries'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { orderRaces } from '@/lib/raceOrdering'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'
import { createOgMetadata } from '@/lib/meta/og'

const getAvailableYearsCached = cache(getAvailableYears)
const getGuidesForYearCached = cache(async (year: number) => getGuidesForYear(year))

export const revalidate = 3600
export const dynamic = 'force-static'

export async function generateMetadata() {
  const year = CURRENT_ELECTION_YEAR

  return createOgMetadata({
    title: 'Tri-Cities Vote',
    description: 'Nonpartisan voter guides for Tri-Cities elections',
    canonicalPath: '/',
    imagePath: `og/${year}/year.png`,
    type: 'website'
  })
}

export default async function HomePage() {
  const availableYears = await getAvailableYearsCached()
  const latestYear = availableYears[0] ?? CURRENT_ELECTION_YEAR
  const guides = await getGuidesForYearCached(latestYear)

  return (
    <main>
      <section className="intro">
        <h1>
          <span role="img" aria-label="ballot box">
            🗳
          </span>
          Tri-Cities Vote:
          <br /> {latestYear} Election
        </h1>
        <h2>
          A nonpartisan, community-driven collection
          <br /> of information to help you decide.
        </h2>
        {/* <div className="hero-actions">
          <Link href={`/${latestYear}`} className="hero-link">
            View the full {latestYear} guide »
          </Link>
        </div> */}
        {/* <YearToggle currentYear={latestYear} availableYears={availableYears} /> */}
      </section>

      <section className="guide-directory">
        {/* <h2>{latestYear} voter guides</h2> */}
        {/* <p>Choose your area to see every race, candidate, and compare view we track.</p> */}

        {guides.length === 0 ? (
          <p className="guide-empty">We have not published guides for this year yet.</p>
        ) : (
          <div className="guide-index">
            {guides.map(guide => {
              const regionSlug = slugify(guide.region.name)
              const orderedRaces = orderRaces(guide.Race, latestYear)

              return (
                <Link key={guide.id} href={`/${latestYear}/guide/${regionSlug}`}>
                  {guide.region.name} »
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <HowToUseThisGuide />

      <ContactInline />
    </main>
  )
}

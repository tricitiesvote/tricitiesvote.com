import { ContactInline } from '@/components/ContactInline'
import { HowToUseThisGuide } from '@/components/home/HowToUseThisGuide'
import { getAvailableYears, getGuidesForYear } from '@/lib/queries'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { orderRaces } from '@/lib/raceOrdering'

export default async function HomePage() {
  const availableYears = await getAvailableYears()
  const latestYear = availableYears[0] || new Date().getFullYear()
  const guides = await getGuidesForYear(latestYear)

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
        <div className="hero-actions">
          <Link href={`/${latestYear}`} className="hero-link">
            View the full {latestYear} guide »
          </Link>
        </div>
        {/* <YearToggle currentYear={latestYear} availableYears={availableYears} /> */}
      </section>

      <section className="guide-directory">
        <h2>{latestYear} voter guides</h2>
        <p>Choose your city or county to see every race, candidate, and compare view we track.</p>

        {guides.length === 0 ? (
          <p className="guide-empty">We have not published guides for this year yet.</p>
        ) : (
          <div className="guide-directory-grid">
            {guides.map(guide => {
              const regionSlug = slugify(guide.region.name)
              const orderedRaces = orderRaces(guide.Race, latestYear)

              return (
                <article key={guide.id} className="guide-card">
                  <h3>
                    <Link href={`/${latestYear}/guide/${regionSlug}`}>
                      {guide.region.name}
                    </Link>
                  </h3>
                  {orderedRaces.length === 0 ? (
                    <p className="race-empty">Race list N/A. Check back soon.</p>
                  ) : (
                    <ul>
                      {orderedRaces.map(race => (
                        <li key={race.id}>
                          <Link href={`/${latestYear}/race/${slugify(race.office.title)}`}>
                            {race.office.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link className="guide-card-link" href={`/${latestYear}/guide/${regionSlug}`}>
                    View full guide »
                  </Link>
                </article>
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

import { ContactInline } from '@/components/ContactInline'
import { HowToUseThisGuide } from '@/components/home/HowToUseThisGuide'
import { RaceCard } from '@/components/race/RaceCard'
import { getAvailableYears, getGuidesForYear } from '@/lib/queries'
import Link from 'next/link'

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

      <HowToUseThisGuide />

      <section className="latest-overview">
        <h2>{latestYear} candidates at a glance</h2>
        <p>
          Explore every race we track below. Jump in to compare candidates, see
          their endorsements, read their statements, and review fundraising.
        </p>

        {guides.length === 0 ? (
          <p className="guide-empty">We have not published guides for this year yet.</p>
        ) : (
          guides.map(guide => (
            <article key={guide.id} className="guide">
              <h3>{guide.region.name}</h3>
              {guide.Race.length === 0 ? (
                <p className="race-empty">No races published for this region yet.</p>
              ) : (
                <div className="races-collection">
                  {guide.Race.map(race => (
                    <RaceCard key={race.id} race={race} year={latestYear} />
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <ContactInline />
    </main>
  )
}

import { getRaceByYearAndSlug } from '@/lib/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CandidateInfo } from '@/components/candidate/CandidateInfo'
import { CandidateEndorsements } from '@/components/candidate/CandidateEndorsements'
import { CandidateDonorSummary } from '@/components/candidate/CandidateDonorSummary'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'

interface ComparePageProps {
  params: {
    year: string
    slug: string
  }
}

export default async function ComparePage({ params }: ComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const race = await getRaceByYearAndSlug(year, params.slug)

  if (!race) {
    notFound()
  }

  const guide = race.Guide?.[0]
  const regionName = guide?.region.name
  const regionSlug = regionName ? slugify(regionName) : null
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)

  return (
    <div className="compare-page">
      <nav>
        <Link href={`/${year}`}>{year} Election</Link>
        {regionName && regionSlug && (
          <>
            {' > '}
            <Link href={`/${year}/guide/${regionSlug}`}>
              {regionName} Guide
            </Link>
          </>
        )}
        {' > '}
        <Link href={`/${year}/race/${params.slug}`}>
          {race.office.title}
        </Link>
        {' > Compare'}
      </nav>

      <header className="page-header">
        <h1>Compare candidates: {race.office.title}</h1>
        <p>
          Review statements, contact info, endorsements, and fundraising side by side.
        </p>
      </header>

      {visibleCandidates.length === 0 ? (
        <p className="candidate-empty">Candidate details N/A.</p>
      ) : (
        <div className="compare-grid">
          {visibleCandidates.map(({ candidate }) => {
            const fundraising = calculateFundraising(candidate.contributions || [])

            return (
              <article key={candidate.id} className="compare-card">
                <CandidateInfo candidate={candidate} year={year} />
                <h2>{candidate.name}</h2>

                <section className="compare-section">
                  <h3>Bio / Statement</h3>
                  {candidate.bio ? (
                    <div className="candidate-body" dangerouslySetInnerHTML={{ __html: candidate.bio }} />
                  ) : candidate.statement ? (
                    <div className="candidate-body" dangerouslySetInnerHTML={{ __html: candidate.statement }} />
                  ) : (
                    <p>Statement N/A.</p>
                  )}
                </section>

                {candidate.engagement && (
                  <section className="compare-section">
                    <h3>Community Engagement</h3>
                    <div className="engagement" dangerouslySetInnerHTML={{ __html: candidate.engagement }} />
                  </section>
                )}

                <section className="compare-section">
                  <h3>Endorsements</h3>
                  <CandidateEndorsements endorsements={candidate.endorsements || []} />
                </section>

                <section className="compare-section">
                  <h3>Fundraising</h3>
                  <CandidateDonorSummary
                    fundraising={fundraising}
                    minifiler={candidate.minifiler}
                    mini={true}
                  />
                </section>

                <Link className="fullLink" href={`/${year}/candidate/${slugify(candidate.name)}`}>
                  View full profile »
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

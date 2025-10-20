import { cache, type CSSProperties } from 'react'
import { getAvailableYears, getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { calculateFundraising } from '@/lib/calculateFundraising'
import { slugify } from '@/lib/utils'
import { CompareTable, type ComparisonRow } from '@/components/compare/CompareTable'
import { CompareQuestionnaires } from '@/components/compare/CompareQuestionnaires'
import { buildBreadcrumbs } from '@/lib/officeDisplay'
import { preferWikiString } from '@/lib/wiki/utils'
import { evaluateTriCitiesRaceStatus } from '@/lib/triCitiesVote'
import { TriCitiesQuestionnaireBanner } from '@/components/race/TriCitiesQuestionnaireBanner'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { CandidateLinkCollection } from '@/components/candidate/CandidateLinkCollection'
import { CandidateEndorsements } from '@/components/candidate/CandidateEndorsements'
import { CandidateEngagementList } from '@/components/candidate/CandidateEngagementList'
import { CompareCandidateDonorCard } from '@/components/compare/CompareCandidateDonorCard'
import { ensureHtml } from '@/lib/richText'
import { BallotMeasureDetails } from '@/components/race/BallotMeasureDetails'
import { deriveMeasureStance } from '@/components/candidate/measureUtils'

interface ComparePageProps {
  params: {
    year: string
    slug: string
  }
}

const getRaceCached = cache(async (year: number, slug: string) => getRaceByYearAndSlug(year, slug))

export const revalidate = 3600

export async function generateStaticParams() {
  const years = await getAvailableYears()
  if (years.length === 0) {
    return []
  }

  const latestYear = years[0]
  const guides = await getGuidesForYear(latestYear)
  const seen = new Set<string>()
  const params: Array<{ year: string; slug: string }> = []

  for (const guide of guides) {
    for (const race of guide.Race) {
      const raceSlug = slugify(race.office.title)
      if (!seen.has(raceSlug)) {
        seen.add(raceSlug)
        params.push({ year: String(latestYear), slug: raceSlug })
      }
    }
  }

  return params
}

export default async function ComparePage({ params }: ComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year)) {
    notFound()
  }

  const race = await getRaceCached(year, params.slug)

  if (!race) {
    notFound()
  }

  const triCitiesStatus = evaluateTriCitiesRaceStatus(race, year)

  const guide = race.Guide?.[0]
  const visibleCandidates = race.candidates.filter(({ candidate }) => !candidate.hide)
  const compareRows: ComparisonRow[] = Array.isArray((race as any)?.comparisons)
    ? ((race as any).comparisons as ComparisonRow[])
    : []
  const isBallotMeasure = race.office.type === 'BALLOT_MEASURE'

  const breadcrumbs = buildBreadcrumbs({
    year,
    region: guide?.region,
    office: race.office,
  })
  breadcrumbs.push({ label: 'Compare', url: `/${year}/compare/${params.slug}` })

  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title

  const candidateCards = visibleCandidates.map(({ candidate }) => {
      const displayName = preferWikiString(candidate as any, 'name') ?? candidate.name
      const slug = slugify(candidate.name)
      const image = preferWikiString(candidate as any, 'image') ?? candidate.image ?? null
    const officeType = candidate.office?.type
    const measureStance = officeType === 'BALLOT_MEASURE'
      ? (deriveMeasureStance(displayName) ?? deriveMeasureStance(candidate.name))
      : null
    const measureBadge = measureStance
      ? {
          label: measureStance === 'support' ? 'YES' : 'NO',
          backgroundColor: '#53bce4'
        }
      : null
    const statementValue = preferWikiString(candidate as any, 'statement')
    const statementHtml = ensureHtml(statementValue)
    const engagementValue = preferWikiString(candidate as any, 'engagement')
    const legacyEngagementHtml = ensureHtml(engagementValue)
    const structuredEngagements = Array.isArray(candidate.engagements)
      ? candidate.engagements.filter(entry => entry.engagement)
      : []

    const fundraising = calculateFundraising(candidate.contributions || [])
    const endorsementStance = measureStance === 'support'
      ? 'MEASURE_YES'
      : measureStance === 'oppose'
        ? 'MEASURE_NO'
        : undefined

    return {
      id: candidate.id,
      displayName,
      slug,
      image,
      officeType,
      measureBadge,
      candidate,
      statementHtml,
      legacyEngagementHtml,
      structuredEngagements,
      endorsements: candidate.endorsements || [],
      minifiler: candidate.minifiler,
      fundraising,
      endorsementStance,
      contact: {
        email: preferWikiString(candidate as any, 'email') ?? candidate.email,
        website: preferWikiString(candidate as any, 'website') ?? candidate.website,
        facebook: preferWikiString(candidate as any, 'facebook') ?? candidate.facebook,
        twitter: preferWikiString(candidate as any, 'twitter') ?? candidate.twitter,
        instagram: preferWikiString(candidate as any, 'instagram') ?? candidate.instagram,
        youtube: preferWikiString(candidate as any, 'youtube') ?? candidate.youtube,
        pdc: candidate.pdc,
        phone: preferWikiString(candidate as any, 'phone'),
      },
      }
    })

  const compareCardRows = [
    {
      key: 'statement',
      render: (card: (typeof candidateCards)[number]) => (
        <>
          <div className="candidate-card-heading candidate-card-heading--center">
            <CandidateImage
              name={card.displayName}
              image={card.image}
              url={`/${year}/candidate/${card.slug}`}
              size={110}
              badge={card.measureBadge}
            />
            <h3>{card.displayName}</h3>
          </div>
          <div className="candidate-card-divider" />
          <div className="candidate-card-contact">
            <CandidateLinkCollection
              candidateId={card.candidate.id}
              email={card.contact.email}
              website={card.contact.website}
              facebook={card.contact.facebook}
              twitter={card.contact.twitter}
              instagram={card.contact.instagram}
              youtube={card.contact.youtube}
              pdc={card.contact.pdc}
              phone={card.contact.phone}
              variant="inline"
            />
          </div>
          <div className="candidate-card-divider" />
          <div className="candidate-card-body">
            {card.statementHtml ? (
              <div className="candidate-card-text" dangerouslySetInnerHTML={{ __html: card.statementHtml }} />
            ) : (
              <p className="candidate-card-placeholder">Statement N/A.</p>
            )}
          </div>
        </>
      ),
    },
    {
      key: 'engagement',
      render: (card: (typeof candidateCards)[number]) => (
        <>
          <div className="candidate-card-heading">
            <div>
              <span className="candidate-card-subhead">{card.displayName}</span>
              <h3>Community Engagement</h3>
            </div>
          </div>
          <div className="candidate-card-body">
            {card.structuredEngagements.length > 0 ? (
              <CandidateEngagementList entries={card.structuredEngagements} variant="compact" />
            ) : card.legacyEngagementHtml ? (
              <div className="candidate-card-text" dangerouslySetInnerHTML={{ __html: card.legacyEngagementHtml }} />
            ) : (
              <p className="candidate-card-placeholder">Awaiting engagement details.</p>
            )}
          </div>
        </>
      ),
    },
    {
      key: 'support',
      render: (card: (typeof candidateCards)[number]) => (
        <>
          <div className="candidate-card-heading">
            <div>
              <span className="candidate-card-subhead">{card.displayName}</span>
              <h3>Endorsements</h3>
            </div>
          </div>
          <div className="candidate-card-body">
            <p className="candidate-card-placeholder">Community letters coming soon.</p>
          </div>
        </>
      ),
    },
    {
      key: 'donors',
      render: (card: (typeof candidateCards)[number]) => (
        <>
          <div className="candidate-card-heading">
            <div>
              <span className="candidate-card-subhead">{card.displayName}</span>
              <h3>Donors</h3>
            </div>
          </div>
          <div className="candidate-card-body">
            <CompareCandidateDonorCard
              fundraising={card.fundraising}
              minifiler={card.candidate.minifiler}
            />
          </div>
        </>
      ),
    },
  ]

  const questionnaireCandidates = candidateCards.map(card => ({
    id: card.id,
    name: card.displayName,
    image: card.image,
    slug: card.slug,
  }))

  const rowsToRender = isBallotMeasure
    ? compareCardRows.filter(row => row.key !== 'engagement')
    : compareCardRows

  return (
    <>
      <nav className="breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`}>
            {index > 0 && ' » '}
            {crumb.url ? <Link href={crumb.url}>{crumb.label}</Link> : crumb.label}
          </span>
        ))}
      </nav>

      <TriCitiesQuestionnaireBanner status={triCitiesStatus} />

      <div className="guide">
        <section className="race race-compare">
          <h1 className="race-title">{displayTitle}</h1>

          <CompareTable rows={compareRows} />

          {isBallotMeasure && (
            <div className="ballot-measure-card">
              <BallotMeasureDetails
                intro={preferWikiString(race as any, 'intro') ?? race.intro ?? null}
                body={preferWikiString(race as any, 'body') ?? race.body ?? null}
              />
            </div>
          )}

          {candidateCards.length === 0 ? (
            <p className="candidate-empty">Candidate details N/A.</p>
          ) : (
            <div className="compare-card-matrix">
              {rowsToRender.map(row => (
                <div
                  key={row.key}
                  className="compare-row"
                  style={{ '--compare-columns': String(candidateCards.length) } as CSSProperties}
                >
                  {candidateCards.map(card => (
                    <div key={`${row.key}-${card.id}`} className={`candidate-card compare-card compare-card-${row.key}`}>
                      {row.render(card)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {!isBallotMeasure && (
            <CompareQuestionnaires
              year={year}
              regionId={race.office.regionId}
              candidates={questionnaireCandidates}
              hiddenTitles={triCitiesStatus.hiddenTitles}
            />
          )}
        </section>
      </div>
    </>
  )
}

import { cache, type CSSProperties } from 'react'
import { getGuidesForYear, getRaceByYearAndSlug } from '@/lib/queries'
import { notFound, redirect } from 'next/navigation'
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
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'
import { createOgMetadata } from '@/lib/meta/og'

interface ComparePageProps {
  params: {
    year: string
    slug: string
  }
}

const getRaceCached = cache(async (year: number, slug: string) => getRaceByYearAndSlug(year, slug))

export const revalidate = 3600

export async function generateStaticParams() {
  const year = CURRENT_ELECTION_YEAR
  const guides = await getGuidesForYear(year)
  const seen = new Set<string>()
  const params: Array<{ year: string; slug: string }> = []

  for (const guide of guides) {
    for (const race of guide.Race) {
      const raceSlug = slugify(race.office.title)
      if (!seen.has(raceSlug)) {
        seen.add(raceSlug)
        params.push({ year: String(year), slug: raceSlug })
      }
    }
  }

  return params
}

export async function generateMetadata({ params }: ComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    return createOgMetadata({
      title: 'Tri-Cities Vote',
      canonicalPath: '/',
      description: 'Nonpartisan voter guides for Tri-Cities elections'
    })
  }

  const race = await getRaceCached(year, params.slug)

  if (!race) {
    notFound()
  }

  const displayTitle = preferWikiString(race.office as any, 'title') ?? race.office.title
  const regionLabel = race.Guide?.[0]?.region?.name ?? 'Tri-Cities'
  const introSource = preferWikiString(race as any, 'intro') ?? race.intro ?? null
  const description = introSource
    ? introSource.replace(/\s+/g, ' ').replace(/[#*_`>~]/g, '')
    : `Compare candidates in the ${displayTitle} race for the ${year} ${regionLabel} ballot.`

  return createOgMetadata({
    title: `${displayTitle} • ${year} Comparison`,
    description,
    canonicalPath: `/${year}/compare/${params.slug}`,
    imagePath: `og/${year}/compare/${params.slug}.png`
  })
}

export default async function ComparePage({ params }: ComparePageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  const race = await getRaceCached(year, params.slug)

  if (!race) {
    notFound()
  }

  const raceWithRelations = race as any
  const triCitiesStatus = evaluateTriCitiesRaceStatus(raceWithRelations, year)

  const guide = raceWithRelations.Guide?.[0]
  const visibleCandidates = (Array.isArray(raceWithRelations.candidates)
    ? (raceWithRelations.candidates as Array<{ candidate: any }>)
    : []
  ).filter(({ candidate }) => !candidate.hide)
  const compareRows: ComparisonRow[] = Array.isArray(raceWithRelations?.comparisons)
    ? (raceWithRelations.comparisons as ComparisonRow[])
    : []
  const isBallotMeasure = raceWithRelations.office.type === 'BALLOT_MEASURE'

  const breadcrumbs = buildBreadcrumbs({
    year,
    region: guide?.region,
    office: raceWithRelations.office,
  })
  breadcrumbs.push({ label: 'Compare', url: `/${year}/compare/${params.slug}` })

  const displayTitle = preferWikiString(raceWithRelations.office as any, 'title') ?? raceWithRelations.office.title

  const candidateCards = visibleCandidates.map(({ candidate }: { candidate: any }) => {
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
      ? candidate.engagements.filter((entry: any) => entry?.engagement)
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
            <p className="candidate-card-placeholder">No endorsement letters yet.</p>
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
        <section className="race race-compare candidate-comparison-race">
          <h1 className="race-title">{displayTitle}</h1>

          <CompareTable rows={compareRows} />

          {isBallotMeasure && (
            <div className="ballot-measure-card">
              <BallotMeasureDetails
                intro={preferWikiString(raceWithRelations as any, 'intro') ?? raceWithRelations.intro ?? null}
                body={preferWikiString(raceWithRelations as any, 'body') ?? raceWithRelations.body ?? null}
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
              regionId={raceWithRelations.office.regionId}
              candidates={questionnaireCandidates}
              hiddenTitles={triCitiesStatus.hiddenTitles}
            />
          )}
        </section>
      </div>
    </>
  )
}

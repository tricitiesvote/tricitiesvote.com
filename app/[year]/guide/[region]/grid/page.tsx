import { Fragment } from 'react'
import {
  getGuideByYearAndRegion,
  getRaceStoryMap,
  getQuestionnaireRespondentIds,
} from '@/lib/queries'
import { RaceGridSection } from '@/components/race/RaceGridSection'
import { notFound, redirect } from 'next/navigation'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

export const revalidate = 0

interface GridPreviewPageProps {
  params: {
    year: string
    region: string
  }
}

function groupLabel(officeType: string): string {
  switch (officeType) {
    case 'US_SENATE':
    case 'US_HOUSE':
      return 'Federal'
    case 'STATE_SENATOR':
    case 'STATE_REPRESENTATIVE':
      return 'State Legislature'
    case 'COUNTY_COMMISSIONER':
    case 'SHERIFF':
    case 'PROSECUTOR':
      return 'County'
    case 'MAYOR':
    case 'CITY_COUNCIL':
    case 'SCHOOL_BOARD':
      return 'City'
    case 'PORT_COMMISSIONER':
      return 'Port & PUD'
    case 'SUPERIOR_COURT_JUDGE':
      return 'Courts'
    case 'BALLOT_MEASURE':
      return 'Ballot Measures'
    default:
      return 'Other'
  }
}

export default async function GridPreviewPage({ params }: GridPreviewPageProps) {
  const year = Number.parseInt(params.year, 10)

  if (!Number.isFinite(year) || year !== CURRENT_ELECTION_YEAR) {
    redirect('/')
  }

  const guide = await getGuideByYearAndRegion(year, params.region)

  if (!guide) {
    notFound()
  }

  const races = guide.Race.filter(
    race => race.candidates.filter(({ candidate }) => !candidate.hide).length > 1
  )
  const candidateIds = races.flatMap(race =>
    race.candidates.map(({ candidate }) => candidate.id)
  )

  const [storyMap, questionnaireRespondents] = await Promise.all([
    getRaceStoryMap(year, races.map(race => race.id)),
    getQuestionnaireRespondentIds(candidateIds),
  ])

  let currentGroup: string | null = null
  const items: Array<{ group?: string; race: (typeof races)[number] }> = []
  for (const race of races) {
    const group = groupLabel(race.office.type)
    if (group !== currentGroup) {
      items.push({ group, race })
      currentGroup = group
    } else {
      items.push({ race })
    }
  }

  return (
    <div className="race-grid-page">
      <h1>
        {year} {guide.region.name} Election Guide
      </h1>

      <div className="race-grid">
        {items.map(({ group, race }) => (
          <Fragment key={race.id}>
            {group && <h2 className="rg-group">{group}</h2>}
            <RaceGridSection
              race={race}
              year={year}
              stories={storyMap.get(race.id)}
              questionnaireRespondents={questionnaireRespondents}
            />
          </Fragment>
        ))}
      </div>
    </div>
  )
}

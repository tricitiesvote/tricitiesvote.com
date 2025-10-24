import { OfficeType } from '@prisma/client'
import { slugify } from './utils'
import { preferWikiString } from './wiki/utils'

export interface BreadcrumbSegment {
  label: string
  url?: string
}

interface BreadcrumbOptions {
  includeCandidate?: boolean
}

export function buildBreadcrumbs(
  params: {
    year: number
    region?: { name: string }
    office?: { title: string; type: OfficeType; titleWiki?: string | null }
    candidateName?: string
  },
  options: BreadcrumbOptions = {}
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = []

  // Don't include year in breadcrumbs - it's redundant
  // segments.push({ label: String(params.year), url: `/${params.year}` })

  if (params.region) {
    const regionSlug = slugify(params.region.name)
    segments.push({ label: params.region.name, url: `/${params.year}/guide/${regionSlug}` })
  }

  if (params.office) {
    const officeSlug = slugify(params.office.title)
    const displayTitle = preferWikiString(params.office as any, 'title') ?? params.office.title
    const { section, seat } = splitOffice(params.office.type, displayTitle)

    // Combine section and seat into one breadcrumb since we don't have separate office listing pages
    const officeLabel = seat ? `${section} ${seat}` : section
    segments.push({ label: officeLabel, url: `/${params.year}/race/${officeSlug}` })
  }

  if (options.includeCandidate && params.candidateName) {
    const candidateSlug = slugify(params.candidateName)
    segments.push({ label: params.candidateName, url: `/${params.year}/candidate/${candidateSlug}` })
  }

  return segments
}

function splitOffice(type: OfficeType, title: string): { section: string; seat?: string | null } {

  switch (type) {
    case OfficeType.CITY_COUNCIL: {
      const match = title.match(/City Council\s+(.*)$/i)
      return { section: 'City Council', seat: match ? match[1] : null }
    }
    case OfficeType.SCHOOL_BOARD: {
      const match = title.match(/School Board\s+(.*)$/i)
      return { section: 'School Board', seat: match ? match[1] : null }
    }
    case OfficeType.PORT_COMMISSIONER: {
      const match = title.match(/^(Port of [^]+?)\s+Commissioner\s+(.*)$/i)
      if (match) {
        return { section: match[1], seat: `Commissioner ${match[2]}` }
      }
      return { section: title }
    }
    case OfficeType.COUNTY_COMMISSIONER: {
      const match = title.match(/Commissioner\s+(.*)$/i)
      return { section: 'County Commissioner', seat: match ? match[1] : null }
    }
    case OfficeType.STATE_SENATOR: {
      const match = title.match(/Senator\s+(.*)$/i)
      return { section: 'State Senator', seat: match ? match[1] : null }
    }
    case OfficeType.STATE_REPRESENTATIVE: {
      const match = title.match(/Representative\s+(.*)$/i)
      return { section: 'State Representative', seat: match ? match[1] : null }
    }
    case OfficeType.SUPERIOR_COURT_JUDGE: {
      const match = title.match(/Judge\s+(.*)$/i)
      return { section: 'Superior Court Judge', seat: match ? match[1] : null }
    }
    case OfficeType.MAYOR:
      return { section: 'Mayor' }
    case OfficeType.SHERIFF:
      return { section: 'Sheriff' }
    case OfficeType.PROSECUTOR:
      return { section: 'Prosecutor' }
    default:
      return { section: title }
  }
}

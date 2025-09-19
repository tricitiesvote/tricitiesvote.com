import { OfficeType } from '@prisma/client'

interface BreadcrumbParts {
  section: string
  seat?: string | null
}

export function getOfficeBreadcrumbParts(
  office: {
    title: string
    type: OfficeType
  }
): BreadcrumbParts {
  const title = office.title
  switch (office.type) {
    case OfficeType.CITY_COUNCIL: {
      const match = title.match(/City Council\s+(.*)$/i)
      return {
        section: 'City Council',
        seat: match ? match[1] : null,
      }
    }
    case OfficeType.SCHOOL_BOARD: {
      const match = title.match(/School Board\s+(.*)$/i)
      return {
        section: 'School Board',
        seat: match ? match[1] : null,
      }
    }
    case OfficeType.PORT_COMMISSIONER: {
      const match = title.match(/^(Port of [^]+?)\s+Commissioner\s+(.*)$/i)
      if (match) {
        return {
          section: match[1],
          seat: `Commissioner ${match[2]}`,
        }
      }
      return {
        section: title,
      }
    }
    case OfficeType.COUNTY_COMMISSIONER: {
      const match = title.match(/Commissioner\s+(.*)$/i)
      return {
        section: 'County Commissioner',
        seat: match ? match[1] : null,
      }
    }
    case OfficeType.STATE_SENATOR: {
      const match = title.match(/Senator\s+(.*)$/i)
      return {
        section: 'State Senator',
        seat: match ? match[1] : null,
      }
    }
    case OfficeType.STATE_REPRESENTATIVE: {
      const match = title.match(/Representative\s+(.*)$/i)
      return {
        section: 'State Representative',
        seat: match ? match[1] : null,
      }
    }
    case OfficeType.SUPERIOR_COURT_JUDGE: {
      const match = title.match(/Judge\s+(.*)$/i)
      return {
        section: 'Superior Court Judge',
        seat: match ? match[1] : null,
      }
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

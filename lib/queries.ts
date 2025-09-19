import { prisma } from './db'
import { ElectionType, OfficeType, Prisma } from '@prisma/client'
import { unslugify } from './utils'

const raceInclude = (year: number) => ({
  office: true,
  candidates: {
    include: {
      candidate: {
        include: {
          endorsements: true,
          contributions: {
            where: { electionYear: year },
            orderBy: { amount: 'desc' as const },
            select: {
              donorName: true,
              amount: true,
              cashOrInKind: true
            }
          }
        }
      }
    },
    orderBy: {
      candidate: {
        name: 'asc' as const
      }
    }
  }
} as const)

const guideInclude = (year: number) => ({
  include: {
    region: true,
    Race: {
      where: { type: ElectionType.GENERAL },
      include: raceInclude(year),
      orderBy: {
        office: {
          title: 'asc' as const
        }
      }
    }
  }
} as const)

type GuideWithRelations = Prisma.GuideGetPayload<ReturnType<typeof guideInclude>>

export async function getAvailableYears(): Promise<number[]> {
  try {
    const guides = await prisma.guide.findMany({
      where: { type: ElectionType.GENERAL },
      select: { electionYear: true },
      distinct: ['electionYear'],
      orderBy: { electionYear: 'desc' }
    })
    return guides.map(g => g.electionYear)
  } catch (error) {
    console.error('Error fetching years:', error)
    return []
  }
}

export async function getLatestYear(): Promise<number> {
  const years = await getAvailableYears()
  return years[0] || new Date().getFullYear()
}

export async function getGuidesForYear(year: number) {
  const guides = await prisma.guide.findMany({
    where: { electionYear: year, type: ElectionType.GENERAL },
    ...guideInclude(year),
    orderBy: {
      region: {
        name: 'asc' as const
      }
    }
  }) as GuideWithRelations[]

  const portGroups = await fetchPortRacesByKey(year)
  guides.forEach(guide => attachPortRaces(guide, portGroups))

  return guides
}

export async function getGuideByYearAndRegion(year: number, regionSlug: string) {
  // Convert slug back to region name (e.g., "benton-county" -> "Benton County")
  const regionName = unslugify(regionSlug)
  
  const region = await prisma.region.findFirst({
    where: { 
      name: { equals: regionName, mode: 'insensitive' }
    }
  })
  
  if (!region) {
    return null
  }
  
  const guide = await prisma.guide.findFirst({
    where: { 
      electionYear: year,
      regionId: region.id,
      type: ElectionType.GENERAL
    },
    ...guideInclude(year)
  }) as GuideWithRelations | null

  if (!guide) {
    return null
  }

  const portGroups = await fetchPortRacesByKey(year)
  attachPortRaces(guide, portGroups)

  return guide
}

export async function getCandidateByYearAndSlug(year: number, slug: string) {
  // Convert slug back to name (e.g., "john-doe" -> "John Doe")
  const name = unslugify(slug)

  return await prisma.candidate.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      electionYear: year
    },
    include: {
      office: true,
      endorsements: true,
      contributions: {
        orderBy: {
          amount: 'desc'
        }
      },
      races: {
        where: {
          race: {
            type: ElectionType.GENERAL
          }
        },
        include: {
          race: {
            include: {
              office: true,
              Guide: {
                include: {
                  region: true
                }
              }
            }
          }
        }
      }
    }
  })
}

export async function getRaceByYearAndSlug(year: number, slug: string) {
  // Convert slug back to office title (e.g., "kennewick-city-council" -> "Kennewick City Council")
  const officeTitle = unslugify(slug)
  
  return await prisma.race.findFirst({
    where: {
      electionYear: year,
      type: ElectionType.GENERAL,
      office: {
        title: { equals: officeTitle, mode: 'insensitive' }
      }
    },
    include: {
      office: true,
      Guide: {
        include: {
          region: true
        }
      },
      candidates: {
        include: {
          candidate: {
            include: {
              office: true,
              endorsements: true,
              contributions: {
                orderBy: {
                  amount: 'desc'
                }
              }
            }
          }
        },
        orderBy: {
          candidate: {
            name: 'asc'
          }
        }
      }
    }
  })
}

function getRaceInclude(year: number) {
  return raceInclude(year)
}

type PortGroupKey = 'benton' | 'kennewick' | 'pasco'

async function fetchPortRacesByKey(year: number) {
  const races = await prisma.race.findMany({
    where: {
      electionYear: year,
      type: ElectionType.GENERAL,
      office: {
        type: OfficeType.PORT_COMMISSIONER
      }
    },
    include: getRaceInclude(year),
    orderBy: {
      office: {
        title: 'asc'
      }
    }
  })

  const groups = new Map<PortGroupKey, typeof races>()

  races.forEach(race => {
    const key = getPortGroupKey(race.office.title)
    if (!key) {
      return
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key)!.push(race)
  })

  return groups
}

function getPortGroupKey(title: string): PortGroupKey | null {
  const upper = title.toUpperCase()

  if (upper.includes('PORT OF BENTON')) {
    return 'benton'
  }

  if (upper.includes('PORT OF KENNEWICK')) {
    return 'kennewick'
  }

  if (upper.includes('PORT OF PASCO')) {
    return 'pasco'
  }

  return null
}

function getPortKeysForRegion(regionName: string): PortGroupKey[] {
  const name = regionName.toLowerCase()

  if (name.includes('richland') || name.includes('west richland')) {
    return ['benton']
  }

  if (name.includes('benton')) {
    return ['benton']
  }

  if (name.includes('kennewick')) {
    return ['kennewick']
  }

  if (name.includes('pasco')) {
    return ['pasco']
  }

  if (name.includes('franklin')) {
    return ['pasco']
  }

  return []
}

function attachPortRaces(
  guide: GuideWithRelations,
  portGroups: Map<PortGroupKey, Awaited<ReturnType<typeof prisma.race.findMany>>>
) {
  const keys = getPortKeysForRegion(guide.region.name)

  if (keys.length === 0) {
    return
  }

  const existingIds = new Set(guide.Race.map(race => race.id))

  keys.forEach(key => {
    const races = portGroups.get(key) || []
    races.forEach(race => {
      if (!existingIds.has(race.id)) {
        guide.Race.push(race)
        existingIds.add(race.id)
      }
    })
  })
}

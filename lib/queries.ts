import { prisma } from './db'

export async function getAvailableYears(): Promise<number[]> {
  try {
    const guides = await prisma.guide.findMany({
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
  return await prisma.guide.findMany({
    where: { electionYear: year },
    include: {
      region: true,
      Race: {
        include: {
          office: true,
          candidates: true
        }
      }
    },
    orderBy: {
      region: {
        name: 'asc'
      }
    }
  })
}

export async function getGuideByYearAndRegion(year: number, regionSlug: string) {
  // Convert slug back to region name (e.g., "benton-county" -> "Benton County")
  const regionName = regionSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  const region = await prisma.region.findFirst({
    where: { 
      name: { equals: regionName, mode: 'insensitive' }
    }
  })
  
  if (!region) {
    return null
  }
  
  return await prisma.guide.findFirst({
    where: { 
      electionYear: year,
      regionId: region.id
    },
    include: {
      region: true,
      Race: {
        include: {
          office: true,
          candidates: {
            include: {
              candidate: true
            },
            orderBy: {
              candidate: {
                name: 'asc'
              }
            }
          }
        },
        orderBy: {
          office: {
            title: 'asc'
          }
        }
      }
    }
  })
}

export async function getCandidateByYearAndSlug(year: number, slug: string) {
  // Convert slug back to name (e.g., "john-doe" -> "John Doe")
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    
  return await prisma.candidate.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      electionYear: year
    },
    include: {
      office: true,
      races: {
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
  // For now, we'll search by office title pattern
  // This is a temporary solution until we add slug to Race
  return await prisma.race.findFirst({
    where: {
      electionYear: year
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
              endorsements: true
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
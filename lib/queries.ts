import { prisma } from './db'

export async function getAvailableYears(): Promise<number[]> {
  try {
    const guides = await prisma.guide.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    })
    return guides.map(g => g.year)
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
    where: { year },
    include: {
      region: true,
      races: {
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
      year,
      regionId: region.id
    },
    include: {
      region: true,
      races: {
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
  return await prisma.candidate.findFirst({
    where: {
      slug
    },
    include: {
      office: true,
      races: {
        include: {
          race: {
            include: {
              office: true,
              guide: {
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
  return await prisma.race.findFirst({
    where: {
      slug,
      year
    },
    include: {
      office: true,
      guide: {
        include: {
          region: true
        }
      },
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
    }
  })
}
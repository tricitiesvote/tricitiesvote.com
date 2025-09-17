import { prisma } from './db'
import { ElectionType } from '@prisma/client'
import { unslugify } from './utils'

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
  return await prisma.guide.findMany({
    where: { electionYear: year, type: ElectionType.GENERAL },
    include: {
      region: true,
      Race: {
        where: { type: ElectionType.GENERAL },
        include: {
          office: true,
          candidates: {
            include: {
              candidate: {
                include: {
                  endorsements: true,
                  contributions: {
                    where: { electionYear: year },
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
  const regionName = unslugify(regionSlug)
  
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
      regionId: region.id,
      type: ElectionType.GENERAL
    },
    include: {
      region: true,
      Race: {
        where: { type: ElectionType.GENERAL },
        include: {
          office: true,
          candidates: {
            include: {
              candidate: {
                include: {
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

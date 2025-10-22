import { PrismaClient } from '@prisma/client'
import * as cheerio from 'cheerio'

interface ElectionResult {
  office: string
  candidate: string
  votes: number
  percentage: number
  position?: string
}

interface ParsedResults {
  county: string
  date: string
  results: ElectionResult[]
}

export class ElectionResultsClient {
  constructor(private prisma: PrismaClient) {}

  async fetchResults(year: number, month: string, county: string) {
    const url = `https://results.vote.wa.gov/results/${year}${month}/${county}/`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch results for ${county}: ${response.status}`)
    }

    const html = await response.text()
    return this.parseResults(html, county)
  }

  private parseResults(html: string, county: string): ParsedResults {
    const $ = cheerio.load(html)
    const results: ElectionResult[] = []
    
    // Find all result tables
    $('.race-results').each((_: any, table: any) => {
      const office = $(table).find('.race-title').text().trim()
      
      $(table).find('tr').each((_: any, row: any) => {
        const cols = $(row).find('td')
        if (cols.length >= 3) { // Valid result row
          results.push({
            office,
            candidate: $(cols[0]).text().trim(),
            votes: parseInt($(cols[1]).text().replace(/,/g, ''), 10),
            percentage: parseFloat($(cols[2]).text().replace('%', '')),
            position: this.extractPosition(office)
          })
        }
      })
    })

    // Extract the election date from the page
    const dateText = $('.election-date').text()
    const date = this.parseElectionDate(dateText)

    return {
      county,
      date,
      results
    }
  }

  private extractPosition(office: string): string | undefined {
    // Extract position number from strings like "City Council Position 3"
    const match = office.match(/Position (\d+)/i)
    return match ? match[1] : undefined
  }

  private parseElectionDate(dateText: string): string {
    // Parse date from format like "November 7, 2023"
    const date = new Date(dateText)
    return date.toISOString()
  }

  // TODO: Fix this method to work with current schema
  /*
  async determineShortTerms(electionYear: number) {
    // Get all winning candidates in city council races
    const races = await this.prisma.race.findMany({
      where: {
        electionYear,
        office: {
          type: 'CITY_COUNCIL', // City Council
          region: {
            name: 'Richland' // Only Richland has short terms
          }
        }
      },
      include: {
        candidates: {
          where: {
            elected: true
          },
          orderBy: {
            voteCount: 'asc'
          },
          include: {
            candidate: true
          }
        }
      }
    })

    // Find the winner with lowest votes in each race
    for (const race of races) {
      if (race.candidates.length > 0) {
        const lowestVoteWinner = race.candidates[0]

        // Update this candidate's term to be short
        await this.prisma.candidateRace.update({
          where: {
            candidateId_raceId: {
              candidateId: lowestVoteWinner.candidateId,
              raceId: race.id
            }
          },
          data: {
            shortTerm: true
          }
        })
      }
    }
  }
  */

  // TODO: Fix this method to work with current schema (no election model)
  /*
  async inferIncumbents() {
    // For each candidate in the current election
    const currentElection = await this.prisma.election.findFirst({
      where: { year: new Date().getFullYear() },
      include: {
        races: {
          include: {
            office: true,
            candidates: {
              include: {
                candidate: true
              }
            }
          }
        }
      }
    })

    if (!currentElection) return

    // Look for previous election winners in same offices
    for (const race of currentElection.races) {
      const previousWinners = await this.prisma.candidateRace.findMany({
        where: {
          race: {
            office: { id: race.office.id },
            election: {
              year: { lt: currentElection.year }
            }
          },
          elected: true
        },
        include: {
          candidate: true
        },
        orderBy: {
          race: {
            election: {
              year: 'desc'
            }
          }
        }
      })

      // Mark current candidates who were previous winners as incumbents
      for (const candidate of race.candidates) {
        const wasWinner = previousWinners.some(
          winner => winner.candidate.name === candidate.candidate.name
        )

        if (wasWinner) {
          await this.prisma.candidateRace.update({
            where: {
              candidateId_raceId: {
                candidateId: candidate.candidateId,
                raceId: race.id
              }
            },
            data: {
              incumbent: true
            }
          })
        }
      }
    }
  }
  */
}
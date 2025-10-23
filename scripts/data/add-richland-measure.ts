#!/usr/bin/env ts-node

import { PrismaClient, ElectionType, OfficeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const electionYear = 2025
  const officeTitle = 'Richland Charter Amendment For Council Districting'

  const region = await prisma.region.findFirst({ where: { name: { equals: 'Richland', mode: 'insensitive' } } })
  if (!region) {
    throw new Error('Richland region not found')
  }

  const guide = await prisma.guide.findFirst({
    where: {
      electionYear,
      regionId: region.id,
      type: ElectionType.GENERAL
    }
  })
  if (!guide) {
    throw new Error('Richland guide not found for 2025')
  }

  const office = await prisma.office.upsert({
    where: {
      regionId_title: {
        regionId: region.id,
        title: officeTitle
      }
    },
    update: {
      type: OfficeType.BALLOT_MEASURE,
      jobTitle: officeTitle
    },
    create: {
      title: officeTitle,
      jobTitle: officeTitle,
      type: OfficeType.BALLOT_MEASURE,
      regionId: region.id
    }
  })

  const introSource = `This citizen-initiated charter amendment would replace Richland's current all at-large council elections with a mixed system of five district positions and two at-large positions, beginning with the first election after adoption.`

  const bodyMarkdown = `Measure No. 1 concerns Richland City Council districting charter amendments.

This measure would amend the Richland City Charter from the current at-large electoral system for all seven Richland City Council positions to a mixed system of district and at-large representation. Positions Nos. 1 through 5 would be elected by geographic districts, while Position Nos. 6 and 7 would be elected at-large. The amendment establishes district boundaries, requires the formation of a five-member Districting Commission, and sets transition and long-term rules for terms and elections.

Should this measure be enacted into law?`

  const proStatement = `It is time to change the way we elect our city council. When Richland was incorporated as a first-class city 67 years ago, the population was 24,000 and the land area was 8 square miles. Today, the population is over 60,000 and the land area is 35 square miles.

Our current all at-large city council is a relic of a by-gone era. Pasco and Kennewick already have district voting. Richland is one of only two first-class cities in Washington that still has an all at-large council. The other one, Vancouver, is also voting in November 2025 on whether to establish voting districts. If Richland rejects the creation of neighborhood voting districts it could be the only first-class city in the state with an all at-large city council.

A more responsive city council
The change to voting districts would encourage closer ties between council members and constituents. City council members serving districts would be more responsive to the diverse needs of our expanding suburbs and historic neighborhoods.

District elections make it easier for voters to get to know the candidates and to reach their representatives after the election. By adopting a district voting system, the cost of running an election campaign would be lower, allowing more people to consider participating in our city government.

Vote "yes" to modernize our city council. We deserve this change for a better Richland.

**Rebuttal of argument against**

The proposal is a non-partisan effort supported by Richland voters across the political spectrum. The district boundaries follow state law, are contiguous, and are equal in population. Council members serve both their district and the city as a whole, preserving teamwork while preventing lockstep conformity. Claims that districts are politically motivated or gerrymandered are completely unfounded. Check out the proposed district boundaries at abetterrichland.com and decide for yourself. Do not be fooled by scare tactics.`

  const conStatement = `Protect your right to vote on every city council position - vote no!
Currently, seven people represent all of Richland. As a team, they work together for the benefit of Richland as a whole.

Districting lowers council member accountability to the entire city, reducing the incentive to consider the wellbeing of voters outside their districts. Without districting, every citizen has all seven members accountable to them. If this initiative passes, every resident will be left with only three council members accountable to them. This discouraging issue can lead to frustrated voters and reduced engagement.

The ironically named "A Better Richland" is a politically motivated group whose motivations do not align with the majority of Richland voters. The proposed lines were drawn for strategic advantages, not community needs.

Please do not be misled to believe our city council members are all from one area. Four of the five proposed districts already have elected council members -- and this usually changes with every election.

The proposed districts fail to account for areas where Richland is expected to grow. Over time, district boundaries will need to change -- raising further concerns about gerrymandering and political manipulation of district lines.

Wards often cause more divisiveness in smaller cities like Richland, bringing more instability than benefit.

Richland needs everyone to have a voice in choosing the best people to represent our entire community. For this we must focus on merit over fragmented geography when electing public officials.

www.KeepRichlandOne.com

**Rebuttal of argument for**

This proposal will divide Richland, chopping it into factions and thereby losing the unity that makes Richland thrive.

The proposal prohibits voting for every councilmember, creates boundaries, and fosters gerrymandering, instability, and reduced accountability.

Richland is not a relic of a by-gone era. Bellevue, Kirkland, Olympia, Chehalis, and Longview vote for all councilmembers. Dividing us will not create unity.

Vote "no" to keep your right to vote for every council member. Vote "no" to remain united.`

  const existingRace = await prisma.race.findFirst({
    where: {
      officeId: office.id,
      electionYear,
      type: ElectionType.GENERAL
    }
  })

  let raceId: string

  if (existingRace) {
    await prisma.race.update({
      where: { id: existingRace.id },
      data: {
        intro: introSource,
        body: bodyMarkdown,
        Guide: {
          connect: { id: guide.id }
        }
      }
    })
    raceId = existingRace.id
  } else {
    const created = await prisma.race.create({
      data: {
        officeId: office.id,
        electionYear,
        type: ElectionType.GENERAL,
        hide: false,
        intro: introSource,
        body: bodyMarkdown,
        Guide: {
          connect: { id: guide.id }
        }
      }
    })
    raceId = created.id
  }

  const MEASURE_COMMITTEES = [
    {
      name: 'Yes to Districts',
      committeeId: 'CO-2025-31659',
      link: 'https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/committees/co-2025-31659',
      email: 'citizensforabetterrichland@gmail.com',
      website: 'https://www.abetterrichland.com/',
      facebook: 'https://www.facebook.com/abetterrichland',
      statement: proStatement
    },
    {
      name: 'No to Districts',
      committeeId: 'CO-2025-37825',
      link: 'https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/committees/co-2025-37825',
      email: 'columbiabasinpac@gmail.com',
      website: 'https://www.keeprichlandone.com/',
      facebook: 'https://www.facebook.com/profile.php?id=61580432879067',
      statement: conStatement
    }
  ] as const

  for (const entry of MEASURE_COMMITTEES) {
    let candidate = await prisma.candidate.findFirst({
      where: {
        electionYear,
        OR: [
          { stateId: entry.committeeId },
          { name: entry.name }
        ]
      }
    })

    if (candidate) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          name: entry.name,
          officeId: office.id,
          stateId: entry.committeeId,
          pdc: entry.link,
          minifiler: false,
          hide: false,
          email: entry.email,
          website: entry.website,
          facebook: entry.facebook,
          statement: entry.statement
        }
      })
    } else {
      candidate = await prisma.candidate.create({
        data: {
          name: entry.name,
          officeId: office.id,
          electionYear,
          stateId: entry.committeeId,
          minifiler: false,
          hide: false,
          pdc: entry.link,
          email: entry.email,
          website: entry.website,
          facebook: entry.facebook,
          statement: entry.statement
        }
      })
    }

    await prisma.candidateRace.upsert({
      where: {
        candidateId_raceId: {
          candidateId: candidate.id,
          raceId
        }
      },
      update: {},
      create: {
        candidateId: candidate.id,
        raceId,
        incumbent: false
      }
    })
  }

  console.log(`✔ Richland ballot measure ready (race ${raceId})`)
}

main()
  .catch(err => {
    console.error('Failed to add Richland measure:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

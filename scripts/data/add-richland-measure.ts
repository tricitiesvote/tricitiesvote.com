#!/usr/bin/env ts-node

import { PrismaClient, ElectionType, OfficeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const electionYear = 2025
  const officeTitle = 'Richland Charter Amendment Council Districting'

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

  const overviewBody = `The proposal keeps all seven councilmembers serving four-year terms but staggers the initial transition so that every position appears on the same ballot once. District boundaries are defined in the amendment and would be maintained by a city-funded Districting Commission.`

  const proArgument = `It has been 67 years since Richland adopted its all at-large council structure. Supporters note that Pasco and Kennewick already use districts and argue that Richland's growth to more than 60,000 residents warrants the same modernization. Districts would deepen relationships between councilmembers and neighborhoods, reduce campaign costs, and make it easier for voters to evaluate candidates.

### Rebuttal of argument against
Supporters emphasize that the map follows state law, produces equal-population and contiguous districts, and was built with broad community input. They encourage voters to review the proposed map at [abetterrichland.com](https://www.abetterrichland.com/) before deciding.`

  const conArgument = `Opponents contend that district representation will fragment accountability—shrinking each resident's direct representation from seven members to just three (two at-large plus one district). They fear added divisiveness, gerrymandering risk, and long-term instability as boundaries shift with growth.

### Rebuttal of argument for
Opponents maintain that richer collaboration comes from electing every councilmember citywide, as comparable cities such as Bellevue and Olympia still do. They urge voters to keep the current system and focus on citywide merit rather than geography.`

  const committees = `### Committees
**Pro Committee**: Karyn Hede, Tim Taylor  
**Contact**: [citizensforabetterrichland@gmail.com](mailto:citizensforabetterrichland@gmail.com)

**Con Committee**: Andrew Rice, Trudy Prince, Dean Gane  
**Contact**: [columbiabasinpac@gmail.com](mailto:columbiabasinpac@gmail.com)

**Pro website**: [abetterrichland.com](https://www.abetterrichland.com/)  
**Con website**: [keeprichlandone.com](https://www.keeprichlandone.com/)`

  const bodyMarkdown = `### Overview
${overviewBody}

### Pro
${proArgument}

### Con
${conArgument}

${committees}`

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
      link: 'https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/committees/co-2025-31659'
    },
    {
      name: 'No to Districts',
      committeeId: 'CO-2025-37825',
      link: 'https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/committees/co-2025-37825'
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
          hide: false
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
          pdc: entry.link
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

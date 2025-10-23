import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Updates A/B questionnaire statements to include proper context
 * This replaces the original fragments with complete sentences
 */
async function main() {
  console.log('Fixing questionnaire statements...\n')

  // City Council - Direct replacements
  const cityCouncilUpdates: Array<{
    position: number
    statementA: string
    statementB: string
  }> = [
    {
      position: 1,
      statementA: 'When making an important decision, I tend to trust in my own lived experiences, judgment, and beliefs.',
      statementB: 'When making an important decision, I tend to seek out opinions and perspectives different from my own.',
    },
    {
      position: 2,
      statementA: 'In addition to increasing affordable housing options, we should address homelessness by prioritizing the enforcement of camping bans in public spaces.',
      statementB: 'In addition to increasing affordable housing options, we should address homelessness by prioritizing the development of low-barrier shelters.',
    },
    {
      position: 5,
      statementA: 'We should address behavioral health needs by focusing on inpatient services for people experiencing addiction and other crises.',
      statementB: 'We should address behavioral health needs by focusing on education, harm reduction, and reducing stigma.',
    },
    {
      position: 6,
      statementA: 'When it comes to energy initiatives, one effective strategy might be to support advanced nuclear technology (small modular reactors).',
      statementB: 'When it comes to energy initiatives, one effective strategy might be to support renewable energy options (like solar and hydro).',
    },
    {
      position: 7,
      statementA: 'To better develop small businesses in our city, we should adjust regulations, including zoning, permits, and licensing fees.',
      statementB: 'To better develop small businesses in our city, we should invest in downtown revitalization and other infrastructure projects that create thriving areas for small business development.',
    },
  ]

  const cityCouncilQuestionnaire = await prisma.questionnaire.findUnique({
    where: { slug: '2025-city-council' },
  })

  if (!cityCouncilQuestionnaire) {
    console.error('City Council questionnaire not found!')
    return
  }

  for (const update of cityCouncilUpdates) {
    const question = await prisma.questionnaireQuestion.findFirst({
      where: {
        questionnaireId: cityCouncilQuestionnaire.id,
        position: update.position,
      },
    })

    if (question) {
      await prisma.questionnaireQuestion.update({
        where: { id: question.id },
        data: {
          statementA: update.statementA,
          statementB: update.statementB,
        },
      })

      console.log(`✓ City Council Position ${update.position}`)
      console.log(`  A: ${update.statementA}`)
      console.log(`  B: ${update.statementB}\n`)
    }
  }

  // School Board - Direct replacements
  const schoolBoardUpdates: Array<{
    position: number
    statementA: string
    statementB: string
  }> = [
    {
      position: 7,
      statementA: 'The district can ease some of the financial, social, and familial burdens of students primarily by partnering with community organizations to provide resources to students and their families.',
      statementB: 'The district can ease some of the financial, social, and familial burdens of students primarily via professional development so that staff members can better identify student needs.',
    },
    {
      position: 10,
      statementA: 'The best way to handle concerns regarding ideology/religion in the classroom is to focus on transparency and visibility into curriculum with clear feedback channels.',
      statementB: 'The best way to handle concerns regarding ideology/religion in the classroom is to focus on professional development and policies that maintain appropriate boundaries.',
    },
    {
      position: 12,
      statementA: "The best method for school districts to support English language learners is a 'Supportive Mainstream' model — English instruction with supplemental language support.",
      statementB: "The best method for school districts to support English language learners is a separate program such as 'Sheltered Instruction' or 'Newcomer' programs.",
    },
    {
      position: 13,
      statementA: 'The district should handle funding shortfalls through budget cuts — downsizing staff, programs, and/or services when necessary.',
      statementB: 'The district should handle funding shortfalls by seeking additional funding through levies and state advocacy.',
    },
  ]

  const schoolBoardQuestionnaire = await prisma.questionnaire.findUnique({
    where: { slug: '2025-school-board' },
  })

  if (!schoolBoardQuestionnaire) {
    console.error('School Board questionnaire not found!')
    return
  }

  for (const update of schoolBoardUpdates) {
    const question = await prisma.questionnaireQuestion.findFirst({
      where: {
        questionnaireId: schoolBoardQuestionnaire.id,
        position: update.position,
      },
    })

    if (question) {
      await prisma.questionnaireQuestion.update({
        where: { id: question.id },
        data: {
          statementA: update.statementA,
          statementB: update.statementB,
        },
      })

      console.log(`✓ School Board Position ${update.position}`)
      console.log(`  A: ${update.statementA}`)
      console.log(`  B: ${update.statementB}\n`)
    }
  }

  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

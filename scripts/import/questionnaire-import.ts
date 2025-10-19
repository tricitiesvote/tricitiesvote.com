import fs from 'node:fs'
import path from 'node:path'
import { Prisma, PrismaClient } from '@prisma/client'
import { NameMatcher } from '../../lib/normalize/names'

const prisma = new PrismaClient()

type QuestionnaireType = 'city-council' | 'school-board'

interface QuestionDefinition {
  position: number
  type: 'AB' | 'OPEN'
  question: string
  statementA?: string
  statementB?: string
  csvColumn: string
}

interface QuestionnaireConfig {
  slug: string
  title: string
  year: number
  csvPath: string
  questions: QuestionDefinition[]
}

const CITY_COUNCIL_QUESTIONS: QuestionDefinition[] = [
  {
    position: 1,
    type: 'AB',
    question: 'When making an important decision:',
    statementA: 'Mostly trust in my own lived experiences, judgment, and beliefs.',
    statementB: 'Seek out opinions and perspectives different from my own.',
    csvColumn: `When making an important decision, I usually tend to:\n\n(A) Mostly trust in my own lived experiences, judgment, and beliefs.\n\n(B) Seek out opinions and perspectives different from my own.`
  },
  {
    position: 2,
    type: 'AB',
    question: 'In regards to the unhoused population, in addition to increasing affordable housing options:',
    statementA: 'We should prioritize the enforcement of camping bans in public spaces.',
    statementB: 'We should prioritize the development of low-barrier shelters.',
    csvColumn: `In regards to the unhoused population, in addition to increasing affordable housing options:\n\n(A) We should prioritize the enforcement of camping bans in public spaces.\n \n(B) We should prioritize the development of low-barrier shelters.`
  },
  {
    position: 3,
    type: 'AB',
    question: 'Regarding public transportation:',
    statementA: 'We have adequate public transportation options; time and money are better spent elsewhere.',
    statementB: 'Our region should invest in / improve public transportation options.',
    csvColumn: `Regarding public transportation:\n\n(A) We have adequate public transportation options; time and money are better spent elsewhere.\n \n(B) Our region should invest in / improve public transportation options.`
  },
  {
    position: 4,
    type: 'AB',
    question: 'When it comes to roads:',
    statementA: 'We should take a multimodal view of transportation, finding examples from other small cities that have developed safe and thriving bike and pedestrian flow.',
    statementB: 'Traffic flow should be the top priority of transportation infrastructure investment.',
    csvColumn: `When it comes to roads:\n\n(A) We should take a multimodal view of transportation, finding examples from other small cities that have developed safe and thriving bike and pedestrian flow.\n \n(B) Traffic flow should be the top priority of transportation infrastructure investment.`
  },
  {
    position: 5,
    type: 'AB',
    question: 'We can best serve the behavioral health needs of our community by:',
    statementA: 'Focusing on inpatient services for people experiencing addiction and other crises.',
    statementB: 'Focusing on education, harm reduction, and reducing stigma.',
    csvColumn: `We can best serve the behavioral health needs of our community by:\n\n(A) Focusing on inpatient services for people experiencing addiction and other crises.\n \n(B) Focusing on education, harm reduction, and reducing stigma.`
  },
  {
    position: 6,
    type: 'AB',
    question: 'When it comes to energy initiatives, one effective strategy might be:',
    statementA: 'To support advanced nuclear technology (small modular reactors)',
    statementB: 'To support renewable energy options (like solar and hydro)',
    csvColumn: `When it comes to energy initiatives, one effective strategy might be:\n\n(A) To support advanced nuclear technology (small modular reactors)\n \n(B) To support renewable energy options (like solar and hydro)`
  },
  {
    position: 7,
    type: 'AB',
    question: 'To better develop small businesses in our city, we should:',
    statementA: 'Adjust regulations, including zoning, permits, and licensing fees.',
    statementB: 'Invest in downtown revitalization and other infrastructure projects that create thriving areas for small business development',
    csvColumn: `To better develop small businesses in our city, we should:\n\n(A) Adjust regulations, including zoning, permits, and licensing fees.\n \n(B) Invest in downtown revitalization and other infrastructure projects that create thriving areas for small business development`
  },
  {
    position: 8,
    type: 'AB',
    question: 'City transparency:',
    statementA: 'The city is doing a good job of being transparent.',
    statementB: 'The city should do a much better job of being transparent.',
    csvColumn: `(A) The city is doing a good job of being transparent.\n\n(B) The city should do a much better job of being transparent.`
  },
  {
    position: 9,
    type: 'AB',
    question: 'Columbia River shore management:',
    statementA: 'The Columbia River shore should be returned to local control.',
    statementB: 'The Columbia River shore should remain under control of the Army Corps of Engineers.',
    csvColumn: `(A) The Columbia River shore should be returned to local control.\n\n(B) The Columbia River shore should remain under control of the Army Corps of Engineers.`
  },
  {
    position: 10,
    type: 'OPEN',
    question: `Rank the city's top 3 most pressing challenges. How would you address them?`,
    csvColumn: `Rank the city's top 3 most pressing challenges. How would you address them?`
  },
  {
    position: 11,
    type: 'OPEN',
    question: 'Pick one piece of city-owned property and express your vision for it.',
    csvColumn: 'Pick one piece of city-owned property and express your vision for it.'
  },
  {
    position: 12,
    type: 'OPEN',
    question: 'If money was no object and you could wave a magic wand, what single thing would you do to improve our city?',
    csvColumn: 'If money was no object and you could wave a magic wand, what single thing would you do to improve our city?'
  }
]

const SCHOOL_BOARD_QUESTIONS: QuestionDefinition[] = [
  {
    position: 1,
    type: 'OPEN',
    question: 'Why did you originally choose to run for school board?',
    csvColumn: 'Why did you originally choose to run for school board?'
  },
  {
    position: 2,
    type: 'OPEN',
    question: 'What are the 3 most important things you want to do in office?',
    csvColumn: 'What are the 3 most important things you want to do in office?'
  },
  {
    position: 3,
    type: 'OPEN',
    question: 'What role should the school board have in making our public schools an excellent learning environment for every child?',
    csvColumn: 'What role do you think the school board should have in making our public schools an excellent learning environment for every child?'
  },
  {
    position: 4,
    type: 'OPEN',
    question: `Rank the school district's top 3 most pressing challenges. How would you address them?`,
    csvColumn: `Rank the school district's top 3 most pressing challenges. How would you address them?`
  },
  {
    position: 5,
    type: 'AB',
    question: 'When making an important decision:',
    statementA: 'Mostly trust in my own lived experiences, judgment, and beliefs.',
    statementB: 'Seek out opinions and perspectives different from my own.',
    csvColumn: `When making an important decision, I usually tend to:\n\n(A) Mostly trust in my own lived experiences, judgment, and beliefs.\n\n(B) Seek out opinions and perspectives different from my own.`
  },
  {
    position: 6,
    type: 'AB',
    question: 'District funding:',
    statementA: 'Our district is underfunded for the needs of our operations, maintenance, and/or capital improvements.',
    statementB: 'Funding in our school district is adequate for operations, maintenance, and/or capital improvements.',
    csvColumn: `(A) Our district is underfunded for the needs of our operations, maintenance, and/or capital improvements.\n\n(B) Funding in our school district is adequate for operations, maintenance, and/or capital improvements.`
  },
  {
    position: 7,
    type: 'AB',
    question: 'Supporting students and families:',
    statementA: 'Primarily by partnering with community organizations to provide resources to students and their families.',
    statementB: 'Primarily via professional development so that staff members can better identify student needs.',
    csvColumn: `The district can ease some of the financial, social, and familial burdens of students:\n\n(A) Primarily by partnering with community organizations to provide resources to students and their families.\n \n(B) Primarily via professional development so that staff members can better identify student needs.`
  },
  {
    position: 8,
    type: 'AB',
    question: 'Teacher compensation:',
    statementA: 'Teachers are compensated fairly within existing budget constraints.',
    statementB: 'Teachers are under-compensated and should be a higher budget priority.',
    csvColumn: `(A) In the context of the constraints of the district budget, our teachers are compensated fairly. Any raises should be through cost of living adjustments or the annual step increases built into the salary schedules for additional education and years of experience teaching.\n\n(B) Teachers in our district are under-compensated and should be a higher budget priority than they are currently.`
  },
  {
    position: 9,
    type: 'AB',
    question: 'Parent involvement:',
    statementA: 'The school board is doing a good job of seeking input from parents.',
    statementB: 'The school board should do a much better job of seeking input from parents.',
    csvColumn: `(A) The school board is doing a good job of seeking input from parents and involving them in in decision making.\n\n(B) The school board should do a much better job of seeking input and involving parents in decision making.`
  },
  {
    position: 10,
    type: 'AB',
    question: 'Handling ideological concerns:',
    statementA: 'Focus on transparency and visibility into curriculum with clear feedback channels.',
    statementB: 'Focus on professional development and policies that maintain appropriate boundaries.',
    csvColumn: `Parents of all backgrounds have concerns about the environment created by both religious and ideological opinions of educators, administrators, and school board members. The best way to handle this is: (A) Through clear communication and transparency, ensuring parents have visibility into curriculum and classroom activities, with established channels for raising concerns. (B) Through strong professional development and policies that help educators maintain appropriate boundaries between their personal beliefs and their instructional practice.`
  },
  {
    position: 11,
    type: 'AB',
    question: 'Chronic absenteeism:',
    statementA: 'Through targeted family outreach and community programs.',
    statementB: 'Through stronger enforcement of consequences for missing classes.',
    csvColumn: `Chronic absenteeism is a complex issue, but one of the best ways to address it is:\n\n(A) Through targeted family outreach and community programs such as Communities in Schools and Attendance Matters.\n \n(B) Through strong enforcement of consequences for missing classes.`
  },
  {
    position: 12,
    type: 'AB',
    question: 'Supporting English language learners:',
    statementA: `A 'Supportive Mainstream' model — English instruction with supplemental language support.`,
    statementB: `A separate program such as 'Sheltered Instruction' or 'Newcomer' programs.`,
    csvColumn: `The best method for school districts to support English language learners is:\n\n(A) A 'Supportive Mainstream' or similar model — English instruction with supplemental language support.\n \n(B) A program separate from mainstream classrooms, such as 'Sheltered Instruction' or 'Newcomer' programs.`
  },
  {
    position: 13,
    type: 'AB',
    question: 'Handling funding shortfalls:',
    statementA: 'Through budget cuts — downsizing staff, programs, and/or services when necessary.',
    statementB: 'By seeking additional funding through levies and state advocacy.',
    csvColumn: `5. Every circumstance is unique, but in very broad strokes, the district should handle funding shortfalls:\n\n(A) Through budget cuts — downsizing staff, programs, and/or services when necessary.\n \n(B) By seeking additional funding through levies and by contacting state legislators.`
  }
]

const NAME_ALIASES: Record<string, string> = {
  'Leo A. Perales': 'Leo Perales',
  'Leo A Perales': 'Leo Perales',
  'Calixto Hernández': 'Calixto Hernandez',
  'Calixto Hernández ': 'Calixto Hernandez',
  'Jacques bakhazi': 'Jacques Bakhazi',
  'Jacques Bakhazi ': 'Jacques Bakhazi',
  'Ryan Whitten ': 'Ryan Whitten',
  'Amanda Brown ': 'Amanda Brown',
  'Kurt H. Maier': 'Kurt H Maier',
  'Robert Perkes': 'Robert Harvey Perkes',
  'Nicolas Uhnak': 'Nic Uhnak'
}

const QUESTIONNAIRE_CONFIG: Record<QuestionnaireType, QuestionnaireConfig> = {
  'city-council': {
    slug: '2025-city-council',
    title: '2025 City Council Questionnaire',
    year: 2025,
    csvPath: path.resolve(process.cwd(), '2025-city-council-responses.csv'),
    questions: CITY_COUNCIL_QUESTIONS
  },
  'school-board': {
    slug: '2025-school-board',
    title: '2025 School Board Questionnaire',
    year: 2025,
    csvPath: path.resolve(process.cwd(), '2025-school-board-responses.csv'),
    questions: SCHOOL_BOARD_QUESTIONS
  }
}

interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

function parseCsv(filePath: string): ParsedCsv {
  const content = fs.readFileSync(filePath, 'utf8')
  const headers: string[] = []
  const rows: string[][] = []

  let field = ''
  let row: string[] = []
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }

  const pushRow = () => {
    if (row.length > 0) {
      rows.push(row)
    }
    row = []
  }

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      pushField()
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      // Handle CRLF by skipping the '\r' (if present)
      if (char === '\r' && nextChar === '\n') {
        continue
      }
      pushField()
      pushRow()
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    pushField()
    pushRow()
  }

  if (rows.length === 0) {
    throw new Error(`CSV at ${filePath} is empty or malformed.`)
  }

  const [headerRow, ...dataRows] = rows
  // Replace any undefined cells with empty string
  const normalizedRows = dataRows.map(r => r.map(value => value ?? ''))

  return {
    headers: headerRow,
    rows: normalizedRows
  }
}

async function buildNameMatcher(year: number) {
  const matcher = new NameMatcher()
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: year },
    select: { id: true, name: true }
  })

  const candidateByName = new Map<string, { id: string; name: string }>()

  for (const candidate of candidates) {
    candidateByName.set(candidate.name, candidate)
    matcher.addKnownName(candidate.name, candidate.id)
  }

  for (const [alias, canonical] of Object.entries(NAME_ALIASES)) {
    const trimmedAlias = alias.trim()
    const trimmedCanonical = canonical.trim()
    const target = candidateByName.get(trimmedCanonical)
    if (target) {
      matcher.addAlias(target.id, trimmedAlias)
    }
  }

  return { matcher, candidateByName }
}

interface QuestionRuntimeMeta {
  definition: QuestionDefinition
  valueIndex: number
  commentIndex: number | null
  record: { id: string; type: 'AB' | 'OPEN' }
}

function cleanCell(value: string | undefined): string {
  return (value ?? '').replace(/\r/g, '').trim()
}

async function importQuestionnaire(type: QuestionnaireType) {
  const config = QUESTIONNAIRE_CONFIG[type]

  if (!fs.existsSync(config.csvPath)) {
    throw new Error(`CSV file not found: ${config.csvPath}`)
  }

  console.log(`\n🔄 Importing ${config.title}...`)

  const { headers, rows } = parseCsv(config.csvPath)
  const nameColumnIndex = headers.findIndex(header => header.trim().toLowerCase() === 'name')

  if (nameColumnIndex === -1) {
    throw new Error('Unable to locate "Name" column in CSV.')
  }

  const questionnaire = await prisma.questionnaire.upsert({
    where: { slug: config.slug },
    create: {
      slug: config.slug,
      title: config.title,
      year: config.year
    },
    update: {
      title: config.title
    }
  })

  const questionMetas: QuestionRuntimeMeta[] = []

  for (const definition of config.questions) {
    const valueIndex = headers.indexOf(definition.csvColumn)
    if (valueIndex === -1) {
      throw new Error(`Could not locate column for question "${definition.question}" in CSV.`)
    }

    const commentIndex = definition.type === 'AB' ? valueIndex + 1 : null
    if (definition.type === 'AB' && (commentIndex == null || headers[commentIndex] == null)) {
      throw new Error(`Expected comment column after question "${definition.question}".`)
    }

    const record = await prisma.questionnaireQuestion.upsert({
      where: {
        questionnaireId_position: {
          questionnaireId: questionnaire.id,
          position: definition.position
        }
      },
      create: {
        questionnaireId: questionnaire.id,
        position: definition.position,
        type: definition.type,
        question: definition.question,
        statementA: definition.statementA ?? null,
        statementB: definition.statementB ?? null
      },
      update: {
        type: definition.type,
        question: definition.question,
        statementA: definition.statementA ?? null,
        statementB: definition.statementB ?? null
      }
    })

    questionMetas.push({
      definition,
      valueIndex,
      commentIndex,
      record: { id: record.id, type: definition.type }
    })
  }

  await prisma.questionnaireResponse.deleteMany({
    where: { questionnaireId: questionnaire.id }
  })
  console.log('  ✓ Cleared existing responses')

  const { matcher } = await buildNameMatcher(config.year)
  const unmatchedNames = new Set<string>()
  const skipped: string[] = []
  let importedCount = 0

  const responseRows: Prisma.QuestionnaireResponseCreateManyInput[] = []

  for (const row of rows) {
    const rawName = cleanCell(row[nameColumnIndex])
    if (!rawName) {
      continue
    }

    const aliasTarget = NAME_ALIASES[rawName] ?? rawName
    const matchInput = aliasTarget.trim()
    const match = matcher.findMatch(matchInput, 0.82)

    if (match.source === 'none') {
      unmatchedNames.add(rawName)
      continue
    }

    const candidateId = match.normalizedName

    for (const meta of questionMetas) {
      const rawValue = cleanCell(row[meta.valueIndex])

      if (meta.record.type === 'AB') {
        if (!rawValue) {
          skipped.push(`${rawName} - Q${meta.definition.position}`)
          continue
        }

        const numericValue = Number.parseInt(rawValue, 10)
        if (!Number.isFinite(numericValue) || numericValue < 1 || numericValue > 4) {
          skipped.push(`${rawName} - Q${meta.definition.position} (invalid value "${rawValue}")`)
          continue
        }

        const comment = meta.commentIndex != null ? cleanCell(row[meta.commentIndex]) : ''

        responseRows.push({
          id: `${candidateId}-${meta.record.id}`,
          questionnaireId: questionnaire.id,
          questionId: meta.record.id,
          candidateId,
          value: numericValue,
          comment: comment || null,
          textResponse: null
        })
        importedCount++
      } else {
        if (!rawValue) {
          continue
        }

        responseRows.push({
          id: `${candidateId}-${meta.record.id}`,
          questionnaireId: questionnaire.id,
          questionId: meta.record.id,
          candidateId,
          value: null,
          comment: null,
          textResponse: rawValue
        })
        importedCount++
      }
    }
  }

  if (responseRows.length > 0) {
    // deleteMany clears everything, so createMany is safe
    await prisma.questionnaireResponse.createMany({
      data: responseRows,
      skipDuplicates: true
    })
  }

  console.log(`\n✅ Import complete for ${config.slug}`)
  console.log(`   - ${importedCount} responses imported`)
  console.log(`   - ${skipped.length} responses skipped (missing/invalid answers)`)
  console.log(`   - ${unmatchedNames.size} candidates unmatched`)

  const unmatchedPath = path.resolve(process.cwd(), `scripts/import/unmatched-${type}.txt`)

  if (unmatchedNames.size > 0) {
    fs.writeFileSync(unmatchedPath, Array.from(unmatchedNames).join('\n'), 'utf8')
    console.log(`   ⚠️  See ${path.relative(process.cwd(), unmatchedPath)} for unmatched names`)
  } else if (fs.existsSync(unmatchedPath)) {
    fs.unlinkSync(unmatchedPath)
  }
}

async function main() {
  const arg = process.argv[2]

  let types: QuestionnaireType[]

  if (!arg) {
    console.error('Usage: npm run import:questionnaire <city-council|school-board|all>')
    process.exit(1)
  }

  if (arg === 'all') {
    types = ['city-council', 'school-board']
  } else if (arg === 'city-council' || arg === 'school-board') {
    types = [arg]
  } else {
    console.error(`Unknown questionnaire type "${arg}". Use "city-council", "school-board", or "all".`)
    process.exit(1)
  }

  for (const type of types) {
    try {
      await importQuestionnaire(type)
    } catch (error) {
      console.error(`❌ Failed to import ${type} questionnaire`)
      console.error(error)
      process.exitCode = 1
    }
  }
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

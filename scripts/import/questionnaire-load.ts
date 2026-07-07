import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { NameMatcher } from '../../lib/normalize/names'
import { generateEngagementSlug } from './config'
import { slugify } from '../../lib/utils'

const prisma = new PrismaClient()

interface QuestionConfig {
  position: number
  type: 'AB' | 'OPEN'
  question: string
  statementA?: string
  statementB?: string
}

interface QuestionnaireConfig {
  slug: string
  year: number
  title: string
  sourceName?: string
  sourceUrl?: string
  scale: number
  hidden?: boolean
  official?: boolean
  regionName?: string
  engagement?: { name: string; date?: string }
  coverage: { officeTitles: string[] }
  aliases?: Record<string, string>
  questions: QuestionConfig[]
}

interface ResponseEntry {
  candidate: string
  answers: Record<string, number | string>
  comments?: Record<string, string>
}

interface ResponsesFile {
  responses: ResponseEntry[]
}

function fail(message: string): never {
  console.error(`ERROR: ${message}`)
  process.exit(1)
}

function loadJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${filePath}`)
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch (error) {
    fail(`Could not parse ${filePath}: ${error instanceof Error ? error.message : error}`)
  }
}

function validateConfig(config: QuestionnaireConfig) {
  if (!config.slug || !config.year || !config.title) {
    fail('questionnaire.json needs slug, year, and title')
  }
  if (config.scale !== 4 && config.scale !== 5) {
    fail(`scale must be 4 or 5, got ${config.scale}`)
  }
  if (!config.coverage?.officeTitles?.length) {
    fail('coverage.officeTitles must list at least one office')
  }
  if (!config.questions?.length) {
    fail('questions must not be empty')
  }
  const positions = new Set<number>()
  for (const q of config.questions) {
    if (positions.has(q.position)) {
      fail(`duplicate question position ${q.position}`)
    }
    positions.add(q.position)
    if (q.type !== 'AB' && q.type !== 'OPEN') {
      fail(`question ${q.position}: type must be AB or OPEN`)
    }
    if (q.type === 'AB' && (!q.statementA || !q.statementB)) {
      fail(`question ${q.position}: AB questions need statementA and statementB`)
    }
    if (!q.question) {
      fail(`question ${q.position}: missing question text`)
    }
  }
}

function validateResponses(config: QuestionnaireConfig, responses: ResponseEntry[]) {
  const questionByPosition = new Map(config.questions.map(q => [String(q.position), q]))

  for (const entry of responses) {
    if (!entry.candidate?.trim()) {
      fail('response entry with empty candidate name')
    }
    for (const [pos, answer] of Object.entries(entry.answers)) {
      const question = questionByPosition.get(pos)
      if (!question) {
        fail(`${entry.candidate}: answer for unknown question position ${pos}`)
      }
      if (question.type === 'AB') {
        if (!Number.isInteger(answer) || (answer as number) < 1 || (answer as number) > config.scale) {
          fail(`${entry.candidate}: question ${pos} value ${answer} outside 1..${config.scale}`)
        }
      } else if (typeof answer !== 'string' || !answer.trim()) {
        fail(`${entry.candidate}: question ${pos} needs a non-empty text answer`)
      }
    }
    for (const pos of Object.keys(entry.comments ?? {})) {
      if (!questionByPosition.has(pos)) {
        fail(`${entry.candidate}: comment for unknown question position ${pos}`)
      }
    }
  }
}

async function resolveCoverage(config: QuestionnaireConfig) {
  const offices = await prisma.office.findMany({
    where: { title: { in: config.coverage.officeTitles } },
    select: { id: true, title: true },
  })

  const foundTitles = new Set(offices.map(o => o.title))
  for (const title of config.coverage.officeTitles) {
    if (!foundTitles.has(title)) {
      fail(`no office found with title "${title}"`)
    }
  }

  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: config.year,
      officeId: { in: offices.map(o => o.id) },
    },
    select: { id: true, name: true, officeId: true },
  })

  if (candidates.length === 0) {
    fail(`no candidates found for ${config.year} in offices: ${config.coverage.officeTitles.join(', ')}`)
  }

  return { offices, candidates }
}

function matchCandidates(
  config: QuestionnaireConfig,
  responses: ResponseEntry[],
  candidates: Array<{ id: string; name: string }>
) {
  const matcher = new NameMatcher()
  for (const candidate of candidates) {
    matcher.addKnownName(candidate.name, candidate.id)
  }
  const candidateById = new Map(candidates.map(c => [c.id, c]))

  const matched = new Map<string, string>() // response candidate name -> candidateId
  const failures: string[] = []

  for (const entry of responses) {
    const inputName = config.aliases?.[entry.candidate] ?? entry.candidate
    const match = matcher.findMatch(inputName, 0.82)
    if (match.source === 'none') {
      failures.push(entry.candidate)
      continue
    }
    matched.set(entry.candidate, match.normalizedName)
    const dbName = candidateById.get(match.normalizedName)?.name
    const marker = match.source === 'exact' ? '=' : `~${match.confidence.toFixed(2)}`
    console.log(`  ${entry.candidate} ${marker} ${dbName}`)
  }

  if (failures.length > 0) {
    fail(`unmatched candidate names: ${failures.join(', ')} — fix spelling or add to aliases`)
  }

  const seen = new Set<string>()
  for (const [name, id] of matched) {
    if (seen.has(id)) {
      fail(`two response entries matched the same candidate (${candidateById.get(id)?.name}); check "${name}"`)
    }
    seen.add(id)
  }

  return matched
}

async function writeQuestionnaire(
  config: QuestionnaireConfig,
  responses: ResponseEntry[],
  matched: Map<string, string>,
  regionId: string | null
) {
  const questionnaire = await prisma.questionnaire.upsert({
    where: { slug: config.slug },
    create: {
      slug: config.slug,
      year: config.year,
      title: config.title,
      scale: config.scale,
      sourceName: config.sourceName ?? null,
      sourceUrl: config.sourceUrl ?? null,
      hidden: config.hidden ?? false,
      official: config.official ?? false,
      regionId,
    },
    update: {
      year: config.year,
      title: config.title,
      scale: config.scale,
      sourceName: config.sourceName ?? null,
      sourceUrl: config.sourceUrl ?? null,
      hidden: config.hidden ?? false,
      official: config.official ?? false,
      regionId,
    },
  })

  const questionIdByPosition = new Map<string, string>()
  for (const q of config.questions) {
    const record = await prisma.questionnaireQuestion.upsert({
      where: {
        questionnaireId_position: { questionnaireId: questionnaire.id, position: q.position },
      },
      create: {
        questionnaireId: questionnaire.id,
        position: q.position,
        type: q.type,
        question: q.question,
        statementA: q.statementA ?? null,
        statementB: q.statementB ?? null,
      },
      update: {
        type: q.type,
        question: q.question,
        statementA: q.statementA ?? null,
        statementB: q.statementB ?? null,
      },
    })
    questionIdByPosition.set(String(q.position), record.id)
  }

  const questionTypeByPosition = new Map(config.questions.map(q => [String(q.position), q.type]))

  const rows: Array<{
    id: string
    questionnaireId: string
    questionId: string
    candidateId: string
    value: number | null
    comment: string | null
    textResponse: string | null
  }> = []

  for (const entry of responses) {
    const candidateId = matched.get(entry.candidate)!
    for (const [pos, answer] of Object.entries(entry.answers)) {
      const questionId = questionIdByPosition.get(pos)!
      const type = questionTypeByPosition.get(pos)!
      rows.push({
        id: `${candidateId}-${questionId}`,
        questionnaireId: questionnaire.id,
        questionId,
        candidateId,
        value: type === 'AB' ? (answer as number) : null,
        comment: entry.comments?.[pos]?.trim() || null,
        textResponse: type === 'OPEN' ? (answer as string).trim() : null,
      })
    }
  }

  await prisma.$transaction([
    prisma.questionnaireResponse.deleteMany({ where: { questionnaireId: questionnaire.id } }),
    prisma.questionnaireResponse.createMany({ data: rows }),
  ])

  console.log(`wrote questionnaire ${config.slug}: ${config.questions.length} questions, ${rows.length} responses`)
  return questionnaire
}

async function syncEngagement(
  config: QuestionnaireConfig,
  offices: Array<{ id: string; title: string }>,
  candidates: Array<{ id: string; name: string; officeId: string }>,
  responderIds: Set<string>
) {
  if (!config.engagement?.name) {
    console.log('no engagement config; skipping participation sync')
    return
  }

  const date = config.engagement.date ? new Date(config.engagement.date) : undefined
  const engagementSlug = generateEngagementSlug(config.engagement.name, date)
  const raceLinkByOffice = new Map(
    offices.map(o => [o.id, `/${config.year}/questionnaires/${slugify(o.title)}`])
  )
  const primaryLink = raceLinkByOffice.get(offices[0].id) ?? `/${config.year}`
  const notes = config.sourceName
    ? `${config.title} by ${config.sourceName}.`
    : `${config.title}.`

  const engagement = await prisma.engagement.upsert({
    where: { slug: engagementSlug },
    create: {
      slug: engagementSlug,
      title: config.engagement.name,
      date: date ?? null,
      primaryLink,
      notes,
    },
    update: {
      title: config.engagement.name,
      date: date ?? null,
      primaryLink,
      notes,
    },
  })

  for (const candidate of candidates) {
    await prisma.candidateEngagement.upsert({
      where: {
        engagementId_candidateId: { engagementId: engagement.id, candidateId: candidate.id },
      },
      create: {
        engagementId: engagement.id,
        candidateId: candidate.id,
        participated: responderIds.has(candidate.id),
        link: raceLinkByOffice.get(candidate.officeId) ?? null,
      },
      update: {
        participated: responderIds.has(candidate.id),
        link: raceLinkByOffice.get(candidate.officeId) ?? null,
      },
    })
  }

  console.log(`synced engagement "${config.engagement.name}": ${responderIds.size} participated, ${candidates.length - responderIds.size} did not`)
}

async function main() {
  const folder = process.argv[2]
  if (!folder) {
    console.log('Usage: npm run import:questionnaire:load -- data/questionnaires/<folder>')
    console.log('Dry run by default; set IMPORT_MODE=db to write.')
    process.exit(1)
  }

  const dir = path.resolve(process.cwd(), folder)
  const config = loadJson<QuestionnaireConfig>(path.join(dir, 'questionnaire.json'))
  const { responses } = loadJson<ResponsesFile>(path.join(dir, 'responses.json'))

  validateConfig(config)
  validateResponses(config, responses)

  let regionId: string | null = null
  if (config.regionName) {
    const region = await prisma.region.findFirst({
      where: { name: { equals: config.regionName, mode: 'insensitive' } },
    })
    if (!region) {
      fail(`no region named "${config.regionName}"`)
    }
    regionId = region.id
  }

  const { offices, candidates } = await resolveCoverage(config)

  console.log(`${config.slug}: "${config.title}" (${config.sourceName ?? 'no source'}), scale ${config.scale}`)
  console.log(`coverage: ${offices.map(o => o.title).join(', ')} — ${candidates.length} candidates`)
  console.log('matching response names:')
  const matched = matchCandidates(config, responses, candidates)

  const responderIds = new Set(matched.values())
  const nonResponders = candidates.filter(c => !responderIds.has(c.id))

  const abCount = config.questions.filter(q => q.type === 'AB').length
  console.log(`questions: ${abCount} AB + ${config.questions.length - abCount} OPEN`)
  for (const entry of responses) {
    const answers = Object.keys(entry.answers).length
    const comments = Object.keys(entry.comments ?? {}).length
    console.log(`  ${entry.candidate}: ${answers} answers${comments ? `, ${comments} comments` : ''}`)
  }
  console.log(`non-responders (${nonResponders.length}): ${nonResponders.map(c => c.name).join(', ') || 'none'}`)

  if (process.env.IMPORT_MODE !== 'db') {
    console.log('\nDry run complete — nothing written. Set IMPORT_MODE=db to import.')
    return
  }

  await writeQuestionnaire(config, responses, matched, regionId)
  await syncEngagement(config, offices, candidates, responderIds)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

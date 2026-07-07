import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { CompareCandidateStatement } from './CompareCandidateStatement'
import { QuestionnaireOpenAnswers } from './QuestionnaireOpenAnswers'

interface CompareQuestionnairesProps {
  year: number
  regionId?: string | null
  candidates: CandidateMeta[]
  hiddenTitles?: string[]
  colorMap?: Map<string, string>
  hideOpenQuestions?: boolean
  collapsed?: boolean
}

interface CandidateMeta {
  id: string
  name: string
  image?: string | null
  slug: string
  officeId?: string
}

interface AbRow {
  id: string
  statementA: string
  statementB: string
  buckets: CandidateEntry[][]
}

interface CandidateEntry {
  id: string
  name: string
  image?: string | null
  slug: string
  comment?: string | null
}

interface OpenQuestion {
  id: string
  question: string
  responses: Record<string, string>
}

type QuestionnaireRecord = {
  id: string
  slug?: string | null
  title: string
  scale: number
  sourceName: string | null
  sourceUrl: string | null
  questions: Array<{
    id: string
    type: string
    position: number
    question: string | null
    statementA: string | null
    statementB: string | null
  }>
  responses: Array<{
    id: string
    candidateId: string
    questionId: string
    value: number | null
    comment: string | null
    textResponse: string | null
    candidate: {
      id: string
      name: string
      image: string | null
    } | null
  }>
}

interface QuestionnaireSection {
  id: string
  title: string
  scale: number
  sourceName: string | null
  sourceUrl: string | null
  abRows: AbRow[]
  openQuestions: OpenQuestion[]
  responderIds: Set<string>
}

export function scaleLabels(scale: number): string[] {
  return scale === 5
    ? ['Strong A', 'Lean A', 'Neutral', 'Lean B', 'Strong B']
    : ['Strong A', 'Lean A', 'Lean B', 'Strong B']
}

const BUCKET_CLASSES_4 = ['strong-a', 'lean-a', 'lean-b', 'strong-b']
const BUCKET_CLASSES_5 = ['strong-a', 'lean-a', 'neutral', 'lean-b', 'strong-b']

export function bucketClasses(scale: number): string[] {
  return scale === 5 ? BUCKET_CLASSES_5 : BUCKET_CLASSES_4
}

export async function CompareQuestionnaires({ year, regionId, candidates, hiddenTitles = [], colorMap, hideOpenQuestions = false, collapsed = false }: CompareQuestionnairesProps) {
  const orderedCandidates = candidates
    .map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      image: candidate.image ?? null,
      slug: candidate.slug,
      officeId: candidate.officeId,
    }))
    .filter(candidate => candidate.name.trim().length > 0)

  if (orderedCandidates.length === 0) {
    return null
  }

  const candidateMap = new Map<string, CandidateMeta>(
    orderedCandidates.map(candidate => [candidate.id, candidate])
  )

  const regionFilter = regionId
    ? [{ regionId: null }, { regionId }]
    : [{ regionId: null }]

  const questionnaires = (await prisma.questionnaire.findMany({
    where: {
      year,
      hidden: false,
      OR: regionFilter,
    },
    include: {
      questions: {
        orderBy: { position: 'asc' },
      },
      responses: {
        where: {
          candidateId: { in: orderedCandidates.map(candidate => candidate.id) },
        },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  })) as QuestionnaireRecord[]

  const hiddenTitleSet = new Set(hiddenTitles)

  const sections: QuestionnaireSection[] = questionnaires
    .map(questionnaire => buildSection(questionnaire, candidateMap))
    .filter(section =>
      (section.abRows.length > 0 || section.openQuestions.length > 0) &&
      !hiddenTitleSet.has(section.title)
    )

  if (sections.length === 0) {
    return null
  }

  return (
    <div className="questionnaire-compare">
      {sections.map(section => {
        const labels = scaleLabels(section.scale)
        const classes = bucketClasses(section.scale)
        const nonResponders = findNonResponders(orderedCandidates, section.responderIds)

        return (
          <details key={section.id} className="questionnaire-compare-section" open={!collapsed}>
            <summary>
              <h2 id="tcv" className="questionnaire-compare-heading">{section.title}</h2>
              {section.sourceName && (
                <p className="questionnaire-source">
                  Survey by{' '}
                  {section.sourceUrl ? (
                    <a href={section.sourceUrl}>{section.sourceName}</a>
                  ) : (
                    section.sourceName
                  )}
                </p>
              )}
            </summary>

            {!hideOpenQuestions && section.openQuestions.length > 0 && (
              <QuestionnaireOpenAnswers
                year={year}
                questions={section.openQuestions.map(question => ({ id: question.id, question: question.question }))}
                candidates={orderedCandidates.map(candidate => ({
                  id: candidate.id,
                  name: candidate.name,
                  image: candidate.image ?? null,
                  slug: candidate.slug,
                }))}
                respondentIds={orderedCandidates
                  .filter(candidate =>
                    section.openQuestions.some(question => question.responses[candidate.id])
                  )
                  .map(candidate => candidate.id)}
                answers={Object.fromEntries(
                  section.openQuestions.map(question => [question.id, question.responses])
                )}
              />
            )}

            {section.abRows.length > 0 && (
              <div className={`compare-table legacy-compare${section.scale === 5 ? ' scale-5' : ''}`}>
                <table>
                  <thead>
                    <tr className="key">
                      <th>Statement A</th>
                      {labels.map(label => (
                        <th key={label}>{label}</th>
                      ))}
                      <th>Statement B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.abRows.map(row => (
                      <tr key={row.id}>
                        <th>
                          <p>{row.statementA}</p>
                        </th>
                        {row.buckets.map((bucket, index) => (
                          <td key={classes[index]} className={classes[index]}>
                            {bucket.map(candidate => (
                              <CompareCandidateStatement
                                key={candidate.id}
                                name={candidate.name}
                                image={candidate.image}
                                comment={candidate.comment}
                                colorClass={colorMap?.get(candidate.id)}
                              />
                            ))}
                          </td>
                        ))}
                        <th>
                          <p>{row.statementB}</p>
                        </th>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {nonResponders.length > 0 && (
              <p className="questionnaire-nonresponders">
                Did not respond: {nonResponders.map(candidate => candidate.name).join(', ')}
              </p>
            )}
          </details>
        )
      })}
    </div>
  )
}

// A candidate counts as a non-responder only when someone from their own
// office answered — a questionnaire aimed at one race shouldn't flag the
// rest of the field on aggregate boards.
function findNonResponders(
  candidates: Array<CandidateMeta & { officeId?: string }>,
  responderIds: Set<string>
): CandidateMeta[] {
  const responderOffices = new Set(
    candidates
      .filter(candidate => responderIds.has(candidate.id) && candidate.officeId)
      .map(candidate => candidate.officeId as string)
  )

  return candidates.filter(candidate => {
    if (responderIds.has(candidate.id)) {
      return false
    }
    if (!candidate.officeId || responderOffices.size === 0) {
      return true
    }
    return responderOffices.has(candidate.officeId)
  })
}

function buildSection(
  questionnaire: QuestionnaireRecord,
  candidateMap: Map<string, CandidateMeta>
): QuestionnaireSection {
  const scale = questionnaire.scale === 5 ? 5 : 4
  const abRows: AbRow[] = []
  const openQuestions: OpenQuestion[] = []
  const responderIds = new Set<string>()

  const responsesByQuestion = new Map<string, typeof questionnaire.responses>()

  for (const response of questionnaire.responses) {
    responderIds.add(response.candidateId)
    const list = responsesByQuestion.get(response.questionId) ?? []
    list.push(response)
    responsesByQuestion.set(response.questionId, list)
  }

  for (const question of questionnaire.questions) {
    const responses = responsesByQuestion.get(question.id) ?? []

    if (question.type === 'AB') {
      const buckets: CandidateEntry[][] = Array.from({ length: scale }, () => [])

      for (const response of responses) {
        if (response.value == null || response.value < 1 || response.value > scale) {
          continue
        }
        const entry = toCandidateEntry(response, candidateMap)
        if (entry) {
          buckets[response.value - 1].push(entry)
        }
      }

      if (buckets.some(bucket => bucket.length > 0)) {
        abRows.push({
          id: question.id,
          statementA: question.statementA ?? '',
          statementB: question.statementB ?? '',
          buckets,
        })
      }
    }

    if (question.type === 'OPEN') {
      const responsesRecord: Record<string, string> = {}

      responses.forEach(response => {
        const entry = toOpenEntry(response, candidateMap)
        if (entry) {
          responsesRecord[entry.id] = entry.answer
        }
      })

      if (Object.keys(responsesRecord).length > 0 && question.question) {
        openQuestions.push({
          id: question.id,
          question: question.question,
          responses: responsesRecord,
        })
      }
    }
  }

  return {
    id: questionnaire.id,
    title: questionnaire.title,
    scale,
    sourceName: questionnaire.sourceName,
    sourceUrl: questionnaire.sourceUrl,
    abRows,
    openQuestions,
    responderIds,
  }
}

function toCandidateEntry(
  response: {
    candidateId: string
    candidate: (CandidateMeta | { id: string; name: string; image: string | null; slug?: string }) | null
    comment: string | null
  },
  candidateMap: Map<string, CandidateMeta>
): CandidateEntry | null {
  const candidate = candidateMap.get(response.candidateId) ?? response.candidate

  if (!candidate) {
    return null
  }

  const slugValue = 'slug' in candidate && candidate.slug ? candidate.slug : slugify(candidate.name)

  return {
    id: candidate.id,
    name: candidate.name,
    image: candidate.image ?? null,
    slug: slugValue,
    comment: response.comment?.trim() ? response.comment.trim() : null,
  }
}

function toOpenEntry(
  response: {
    candidateId: string
    candidate: (CandidateMeta | { id: string; name: string; image: string | null; slug?: string }) | null
    textResponse: string | null
  },
  candidateMap: Map<string, CandidateMeta>
): (CandidateMeta & { answer: string }) | null {
  const candidate = candidateMap.get(response.candidateId) ?? response.candidate

  if (!candidate || !response.textResponse) {
    return null
  }

  const slugValue = 'slug' in candidate && candidate.slug ? candidate.slug : slugify(candidate.name)

  return {
    id: candidate.id,
    name: candidate.name,
    image: candidate.image ?? null,
    slug: slugValue,
    answer: response.textResponse.trim(),
  }
}

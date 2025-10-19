import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { CompareCandidateStatement } from './CompareCandidateStatement'

interface CompareQuestionnairesProps {
  year: number
  regionId?: string | null
  candidates: CandidateMeta[]
  hiddenTitles?: string[]
}

interface CandidateMeta {
  id: string
  name: string
  image?: string | null
}

interface AbRow {
  id: string
  statementA: string
  statementB: string
  strongA: CandidateEntry[]
  leanA: CandidateEntry[]
  leanB: CandidateEntry[]
  strongB: CandidateEntry[]
}

interface CandidateEntry extends CandidateMeta {
  comment?: string | null
}

interface OpenQuestion {
  id: string
  question: string
  responses: Record<string, string>
}

type QuestionnaireWithRelations = Prisma.QuestionnaireGetPayload<{
  include: {
    questions: true
    responses: {
      include: {
        candidate: true
      }
    }
  }
}>

interface QuestionnaireSection {
  id: string
  title: string
  abRows: AbRow[]
  openQuestions: OpenQuestion[]
}

export async function CompareQuestionnaires({
  year,
  regionId,
  candidates,
  hiddenTitles = []
}: CompareQuestionnairesProps) {
  const orderedCandidates = candidates
    .map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      image: candidate.image ?? null
    }))
    .filter(candidate => candidate.name.trim().length > 0)

  if (orderedCandidates.length === 0) {
    return null
  }

  const candidateMap = new Map<string, CandidateMeta>()
  for (const candidate of orderedCandidates) {
    candidateMap.set(candidate.id, candidate)
  }

  const candidateIds = orderedCandidates.map(candidate => candidate.id)

  const regionFilter = regionId
    ? [{ regionId: null }, { regionId }]
    : [{ regionId: null }]

  const questionnaires = await prisma.questionnaire.findMany({
    where: {
      year,
      OR: regionFilter
    },
    include: {
      questions: {
        orderBy: { position: 'asc' }
      },
      responses: {
        where: {
          candidateId: { in: candidateIds }
        },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      }
    },
    orderBy: { title: 'asc' }
  })

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
      {sections.map(section => (
        <section key={section.id} className="questionnaire-compare-section">
          <h2 className="questionnaire-compare-heading">{section.title}</h2>

          {section.openQuestions.length > 0 && (
            <div className="questionnaire-open">
              {section.openQuestions.map(question => {
                const gridStyle = {
                  gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))`
                }

                return (
                  <div key={question.id} className="questionnaire-open-block">
                    <div className="questionnaire-open-question-cell">
                      <h3>{question.question}</h3>
                    </div>
                    <div className="questionnaire-open-answer-list" style={gridStyle}>
                      {orderedCandidates.map(candidate => {
                        const answer = question.responses[candidate.id]
                        return (
                          <div
                            key={candidate.id}
                            className={`questionnaire-open-answer-card${answer ? '' : ' questionnaire-open-answer-empty'}`}
                          >
                            <h4>{candidate.name}</h4>
                            {answer ? <p>{answer}</p> : <span className="questionnaire-open-answer-none">—</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {section.abRows.length > 0 && (
            <div className="compare-table legacy-compare">
              <table>
                <thead>
                  <tr className="key">
                    <th>Statement A</th>
                    <th>Strong A</th>
                    <th>Lean A</th>
                    <th>Lean B</th>
                    <th>Strong B</th>
                    <th>Statement B</th>
                  </tr>
                </thead>
                <tbody>
                  {section.abRows.map(row => (
                    <tr key={row.id}>
                      <th>
                        <p>{row.statementA}</p>
                      </th>
                      <td className="strong-a">
                        {row.strongA.map(candidate => (
                          <CompareCandidateStatement
                            key={candidate.id}
                            name={candidate.name}
                            image={candidate.image}
                            comment={candidate.comment}
                          />
                        ))}
                      </td>
                      <td className="lean-a">
                        {row.leanA.map(candidate => (
                          <CompareCandidateStatement
                            key={candidate.id}
                            name={candidate.name}
                            image={candidate.image}
                            comment={candidate.comment}
                          />
                        ))}
                      </td>
                      <td className="lean-b">
                        {row.leanB.map(candidate => (
                          <CompareCandidateStatement
                            key={candidate.id}
                            name={candidate.name}
                            image={candidate.image}
                            comment={candidate.comment}
                          />
                        ))}
                      </td>
                      <td className="strong-b">
                        {row.strongB.map(candidate => (
                          <CompareCandidateStatement
                            key={candidate.id}
                            name={candidate.name}
                            image={candidate.image}
                            comment={candidate.comment}
                          />
                        ))}
                      </td>
                      <th>
                        <p>{row.statementB}</p>
                      </th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function buildSection(
  questionnaire: QuestionnaireWithRelations,
  candidateMap: Map<string, CandidateMeta>
): QuestionnaireSection {
  const abRows: AbRow[] = []
  const openQuestions: OpenQuestion[] = []

  const responsesByQuestion = new Map<string, typeof questionnaire.responses>()

  for (const response of questionnaire.responses) {
    const list = responsesByQuestion.get(response.questionId) ?? []
    list.push(response)
    responsesByQuestion.set(response.questionId, list)
  }

  for (const question of questionnaire.questions) {
    const responses = responsesByQuestion.get(question.id) ?? []

    if (question.type === 'AB') {
      const strongA = responses
        .filter(response => response.value === 1)
        .map(response => toCandidateEntry(response, candidateMap))
        .filter(Boolean) as CandidateEntry[]

      const leanA = responses
        .filter(response => response.value === 2)
        .map(response => toCandidateEntry(response, candidateMap))
        .filter(Boolean) as CandidateEntry[]

      const leanB = responses
        .filter(response => response.value === 3)
        .map(response => toCandidateEntry(response, candidateMap))
        .filter(Boolean) as CandidateEntry[]

      const strongB = responses
        .filter(response => response.value === 4)
        .map(response => toCandidateEntry(response, candidateMap))
        .filter(Boolean) as CandidateEntry[]

      if (strongA.length || leanA.length || leanB.length || strongB.length) {
        abRows.push({
          id: question.id,
          statementA: question.statementA ?? '',
          statementB: question.statementB ?? '',
          strongA,
          leanA,
          leanB,
          strongB
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
          responses: responsesRecord
        })
      }
    }
  }

  return {
    id: questionnaire.id,
    title: questionnaire.title,
    abRows,
    openQuestions
  }
}

function toCandidateEntry(
  response: {
    candidateId: string
    candidate: CandidateMeta | null
    comment: string | null
  },
  candidateMap: Map<string, CandidateMeta>
): CandidateEntry | null {
  const candidate = candidateMap.get(response.candidateId) ?? response.candidate

  if (!candidate) {
    return null
  }

  return {
    id: candidate.id,
    name: candidate.name,
    image: candidate.image,
    comment: response.comment?.trim() ? response.comment.trim() : null
  }
}

function toOpenEntry(
  response: {
    candidateId: string
    candidate: CandidateMeta | null
    textResponse: string | null
  },
  candidateMap: Map<string, CandidateMeta>
): (CandidateMeta & { answer: string }) | null {
  const candidate = candidateMap.get(response.candidateId) ?? response.candidate

  if (!candidate || !response.textResponse) {
    return null
  }

  return {
    id: candidate.id,
    name: candidate.name,
    image: candidate.image,
    answer: response.textResponse.trim()
  }
}

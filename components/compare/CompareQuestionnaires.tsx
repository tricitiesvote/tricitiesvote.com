import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { CompareCandidateStatement } from './CompareCandidateStatement'

interface CompareQuestionnairesProps {
  raceId: string
  year: number
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
  responses: Array<CandidateMeta & { answer: string }>
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

export async function CompareQuestionnaires({ raceId, year }: CompareQuestionnairesProps) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    select: {
      office: { select: { regionId: true } },
      candidates: {
        select: {
          candidateId: true,
          candidate: {
            select: {
              id: true,
              name: true,
              image: true,
              hide: true
            }
          }
        }
      }
    }
  })

  if (!race) {
    return null
  }

  const visibleCandidates = race.candidates
    .filter(({ candidate }) => candidate && !candidate.hide)
    .map(({ candidateId, candidate }) => ({
      id: candidateId,
      name: candidate?.name ?? '',
      image: candidate?.image ?? null
    }))
    .filter(candidate => candidate.name.trim().length > 0)

  if (visibleCandidates.length === 0) {
    return null
  }

  const candidateMap = new Map<string, CandidateMeta>()
  for (const candidate of visibleCandidates) {
    candidateMap.set(candidate.id, candidate)
  }

  const regionFilter = race.office.regionId
    ? [{ regionId: null }, { regionId: race.office.regionId }]
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
          candidateId: { in: visibleCandidates.map(candidate => candidate.id) }
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

  const sections: QuestionnaireSection[] = questionnaires
    .map(questionnaire => buildSection(questionnaire, candidateMap))
    .filter(section => section.abRows.length > 0 || section.openQuestions.length > 0)

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
              {section.openQuestions.map(question => (
                <article key={question.id} className="questionnaire-open-question">
                  <h3>{question.question}</h3>
                  <div className="questionnaire-open-responses">
                    {question.responses.map(response => (
                      <div key={response.id} className="questionnaire-open-response">
                        <strong>{response.name}</strong>
                        <p>{response.answer}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
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
      const openResponses = responses
        .filter(response => Boolean(response.textResponse))
        .map(response => toOpenEntry(response, candidateMap))
        .filter(Boolean) as OpenQuestion['responses']

      if (openResponses.length > 0 && question.question) {
        openQuestions.push({
          id: question.id,
          question: question.question,
          responses: openResponses
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

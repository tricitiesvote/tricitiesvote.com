// @ts-nocheck
import { prisma } from '@/lib/db'

const SCALE_LABELS = ['', 'Strong A', 'Lean A', 'Lean B', 'Strong B'] as const

interface QuestionnaireResponsesProps {
  candidateId: string
  year: number
  hiddenTitles?: string[]
}

export async function QuestionnaireResponses({
  candidateId,
  year,
  hiddenTitles = []
}: QuestionnaireResponsesProps) {
  const questionnaires = await prisma.questionnaire.findMany({
    where: { year },
    include: {
      questions: {
        orderBy: { position: 'asc' }
      },
      responses: {
        where: { candidateId },
        include: {
          question: true
        }
      }
    },
    orderBy: { title: 'asc' }
  })

  const sections = questionnaires
    .map(q => {
      const responseByQuestionId = new Map(q.responses.map(response => [response.questionId, response]))

      const items = q.questions
        .map(question => {
          const response = responseByQuestionId.get(question.id)
          if (!response) {
            return null
          }

          if (question.type === 'AB') {
            if (response.value == null) {
              return null
            }

            return {
              question,
              response,
              type: 'AB' as const
            }
          }

          if (!response.textResponse) {
            return null
          }

          return {
            question,
            response,
            type: 'OPEN' as const
          }
        })
        .filter(Boolean)

      if (items.length === 0) {
        return null
      }

      return {
        id: q.id,
        title: q.title,
        items: items as Array<{
          type: 'AB' | 'OPEN'
          question: typeof q.questions[number]
          response: typeof q.responses[number]
        }>
      }
    })
    .filter((section): section is NonNullable<typeof section> => section !== null)
    .filter(section => !hiddenTitles.includes(section.title))

  if (sections.length === 0) {
    return null
  }

  return (
    <div className="questionnaire-responses">
      {sections.map(section => (
        <div key={section.id} className="questionnaire-section">
          <h4>{section.title}</h4>
          {section.items.map(item => {
            const questionText = item.question.question
            if (item.type === 'AB') {
              const value = item.response.value ?? 0
              const scaleLabel = SCALE_LABELS[value] ?? ''

              return (
                <div key={item.question.id} className="q-and-a">
                  {questionText && (
                    <p className="question-text">{questionText}</p>
                  )}
                  <div className="ab-statements">
                    <span className="statement-a">{item.question.statementA}</span>
                    <span className="statement-b">{item.question.statementB}</span>
                  </div>
                  {value > 0 && (
                    <span className={`scale-value scale-${value}`}>
                      {scaleLabel}
                    </span>
                  )}
                  {item.response.comment && (
                    <p className="response-comment">{item.response.comment}</p>
                  )}
                </div>
              )
            }

            return (
              <div key={item.question.id} className="q-and-a">
                {questionText && (
                  <p className="question-text">{questionText}</p>
                )}
                {item.response.textResponse && (
                  <p className="response">{item.response.textResponse}</p>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

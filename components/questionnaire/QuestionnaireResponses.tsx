import { prisma } from '@/lib/db'

function scaleLabel(scale: number, value: number): string {
  const labels = scale === 5
    ? ['Strong A', 'Lean A', 'Neutral', 'Lean B', 'Strong B']
    : ['Strong A', 'Lean A', 'Lean B', 'Strong B']
  return labels[value - 1] ?? ''
}

// Reuse the 4-point color ramp on 5-point scales: the middle value gets its
// own neutral style and the B side shifts up one.
function scaleClass(scale: number, value: number): string {
  if (scale === 5) {
    if (value === 3) return 'scale-neutral'
    return value < 3 ? `scale-${value}` : `scale-${value - 1}`
  }
  return `scale-${value}`
}

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
    where: { year, hidden: false },
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
        scale: q.scale === 5 ? 5 : 4,
        sourceName: q.sourceName,
        sourceUrl: q.sourceUrl,
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
          {section.items.map(item => {
            const questionText = item.question.question
            if (item.type === 'AB') {
              const value = item.response.value ?? 0

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
                    <span className={`scale-value ${scaleClass(section.scale, value)}`}>
                      {scaleLabel(section.scale, value)}
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

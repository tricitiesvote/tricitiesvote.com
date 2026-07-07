'use client'

import { useState } from 'react'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { useCompareSelection } from './CompareSelection'

interface OpenQuestion {
  id: string
  question: string
}

interface OpenAnswerCandidate {
  id: string
  name: string
  image: string | null
  slug: string
}

interface QuestionnaireOpenAnswersProps {
  year: number
  questions: OpenQuestion[]
  candidates: OpenAnswerCandidate[]
  respondentIds: string[]
  // questionId -> candidateId -> answer text
  answers: Record<string, Record<string, string>>
}

function lastName(name: string): string {
  const parts = name.replace(/"[^"]*"/g, '').trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

export function QuestionnaireOpenAnswers({ year, questions, candidates, respondentIds, answers }: QuestionnaireOpenAnswersProps) {
  const selection = useCompareSelection()
  const respondentIdSet = new Set(respondentIds)
  const respondents = candidates.filter(candidate => respondentIdSet.has(candidate.id))
  const usePicker = !selection && respondents.length > 2
  const [selected, setSelected] = useState<string[]>(respondents.slice(0, 2).map(r => r.id))

  if (questions.length === 0 || respondents.length === 0) {
    return null
  }

  const candidateById = new Map(candidates.map(candidate => [candidate.id, candidate]))

  let visible: OpenAnswerCandidate[]
  if (selection) {
    visible = selection.orderedVisibleIds
      .map(id => candidateById.get(id))
      .filter(Boolean) as OpenAnswerCandidate[]
  } else if (usePicker) {
    visible = respondents.filter(r => selected.includes(r.id))
  } else {
    visible = respondents
  }

  if (visible.length === 0) {
    return null
  }

  const selectCandidate = (id: string) => {
    if (selected.includes(id)) {
      return
    }
    // Rotate: the earlier selection leaves, the newcomer joins.
    setSelected([selected[1], id].filter(Boolean) as string[])
  }

  return (
    <div className="questionnaire-open">
      {usePicker && (
        <div className="questionnaire-open-picker" role="group" aria-label="Choose two candidates to compare">
          <p className="questionnaire-open-picker-hint">Pick two to compare:</p>
          <ul className="questionnaire-open-picker-rail">
            {respondents.map(candidate => {
              const isSelected = selected.includes(candidate.id)
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className={`questionnaire-open-picker-chip${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => selectCandidate(candidate.id)}
                  >
                    <span className="questionnaire-open-picker-face">
                      {candidate.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={candidate.image} alt="" width={28} height={28} />
                      ) : (
                        <span className="questionnaire-open-picker-initials">
                          {candidate.name.split(' ').map(part => part[0]).join('').toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="questionnaire-open-picker-name">{lastName(candidate.name)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {questions.map(question => (
        <div key={question.id} className="questionnaire-open-block">
          <div className="questionnaire-open-question-cell">
            <h3>{question.question}</h3>
          </div>
          <div className={`questionnaire-open-answer-list columns-${Math.min(visible.length, 6)}`}>
            {visible.map(candidate => {
              const answer = answers[question.id]?.[candidate.id]
              const candidateUrl = `/${year}/candidate/${candidate.slug}`
              const cardClass = `questionnaire-open-answer-card candidate-card${answer ? '' : ' questionnaire-open-answer-empty'}`

              return (
                <div key={candidate.id} className={cardClass}>
                  <div className="candidate-card-heading">
                    <CandidateImage name={candidate.name} image={candidate.image} url={candidateUrl} size={38} />
                    <h4>{candidate.name}</h4>
                  </div>
                  <div className="candidate-card-body candidate-card-body-answer">
                    {answer ? (
                      <p className="candidate-card-text">{answer}</p>
                    ) : (
                      <span className="questionnaire-open-answer-none">
                        {respondentIdSet.has(candidate.id) ? '—' : 'Did not respond to this survey.'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

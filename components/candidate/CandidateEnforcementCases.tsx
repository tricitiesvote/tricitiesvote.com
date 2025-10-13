import { Alert } from '@/components/ui/alert'

interface EnforcementCase {
  id: string
  caseNumber: string
  opened: Date
  subject: string
  status: string
  areasOfLaw: string
  url: string
}

interface CandidateEnforcementCasesProps {
  cases: EnforcementCase[]
}

// Only show actual violations/warnings (not dismissed cases, etc.)
const VIOLATION_STATUSES = [
  'Violation Found by Commission',
  'Resolved by Attorney General - Violation',
  'Resolved by Citizen Under RCW 42.17A.765 - Violation',
  'Case Closed with Written Warning',
  'Case Closed with Reminder'
]

export function CandidateEnforcementCases({ cases }: CandidateEnforcementCasesProps) {
  if (!cases || cases.length === 0) {
    return null
  }

  // Filter to only show violations
  const violations = cases.filter(c => VIOLATION_STATUSES.includes(c.status))

  if (violations.length === 0) {
    return null
  }

  return (
    <section className="candidate-section enforcement-cases">
      <h4>PDC Enforcement Actions</h4>
      {violations.map((enforcementCase) => (
        <Alert key={enforcementCase.id} variant="warning">
          <p className="enforcement-subject">
            <strong>{enforcementCase.subject}</strong>
          </p>
          <p className="enforcement-details">
            <strong>Status:</strong> {enforcementCase.status}
            <br />
            <strong>Areas of Law:</strong> {enforcementCase.areasOfLaw}
            <br />
            <strong>Opened:</strong> {new Date(enforcementCase.opened).toLocaleDateString()}
          </p>
          <p>
            <a href={enforcementCase.url} target="_blank" rel="noopener noreferrer">
              View case details on PDC website →
            </a>
          </p>
        </Alert>
      ))}
    </section>
  )
}

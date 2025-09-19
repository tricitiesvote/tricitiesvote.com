import { Fragment } from 'react'
import Image from 'next/image'

export interface ComparisonCandidate {
  id?: string
  name: string
  image?: string | null
  comment?: string | null
  position?: string | null
}

export interface ComparisonRow {
  id?: string
  question?: string | null
  statementA?: string | null
  statementB?: string | null
  strongA?: ComparisonCandidate[]
  leanA?: ComparisonCandidate[]
  leanB?: ComparisonCandidate[]
  strongB?: ComparisonCandidate[]
  responses?: {
    strongA?: ComparisonCandidate[]
    leanA?: ComparisonCandidate[]
    leanB?: ComparisonCandidate[]
    strongB?: ComparisonCandidate[]
  }
}

function bucketHasEntries(bucket?: ComparisonCandidate[]) {
  return Array.isArray(bucket) && bucket.length > 0
}

function rowHasContent(row: ComparisonRow) {
  const buckets = row.responses ?? row
  return (
    bucketHasEntries(buckets.strongA) ||
    bucketHasEntries(buckets.leanA) ||
    bucketHasEntries(buckets.leanB) ||
    bucketHasEntries(buckets.strongB)
  )
}

interface CompareTableProps {
  rows: ComparisonRow[]
}

export function CompareTable({ rows }: CompareTableProps) {
  const populatedRows = rows.filter(rowHasContent)

  if (populatedRows.length === 0) {
    return null
  }

  return (
    <div className="compare-table">
      <table>
        <thead>
          <tr className="compare-key">
            <th>Statement A</th>
            <th>Strong A</th>
            <th>Lean A</th>
            <th>Lean B</th>
            <th>Strong B</th>
            <th>Statement B</th>
          </tr>
        </thead>
        <tbody>
          {populatedRows.map((row, index) => {
            const key = row.id ?? row.question ?? `row-${index}`
            const buckets = row.responses ?? row

            return (
              <Fragment key={key}>
                {row.question && (
                  <tr className="compare-question">
                    <th colSpan={6}>{row.question}</th>
                  </tr>
                )}
                <tr>
                  <th>{renderStatement(row.statementA)}</th>
                  <td>{renderBucket(buckets.strongA)}</td>
                  <td>{renderBucket(buckets.leanA)}</td>
                  <td>{renderBucket(buckets.leanB)}</td>
                  <td>{renderBucket(buckets.strongB)}</td>
                  <th>{renderStatement(row.statementB)}</th>
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function renderStatement(statement?: string | null) {
  if (!statement) {
    return null
  }

  return <p dangerouslySetInnerHTML={{ __html: statement }} />
}

function renderBucket(entries?: ComparisonCandidate[]) {
  if (!entries || entries.length === 0) {
    return null
  }

  return (
    <div className="compare-bucket">
      {entries.map((entry, index) => {
        const key = entry.id ?? `${entry.name}-${index}`

        return (
          <div key={key} className="compare-person">
            {entry.image && (
              <Image
                src={entry.image}
                alt={entry.name}
                width={40}
                height={40}
                sizes="40px"
                unoptimized={/^https?:/i.test(entry.image)}
              />
            )}
            <div>
              <strong>{entry.name}</strong>
              {entry.comment && (
                <p dangerouslySetInnerHTML={{ __html: entry.comment }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

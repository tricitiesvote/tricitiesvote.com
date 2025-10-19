/**
 * League of Women Voters (Vote411) Scraper
 *
 * Queries the public Vote411 API to capture questionnaire participation and
 * detailed responses for Tri-Cities 2025 general-election races.
 *
 * Outputs two CSV files:
 *   - scripts/import/lowv-responses.csv
 *   - scripts/import/lowv-questionnaire-responses.csv
 *
 * Usage:
 *   npm run import:lowv
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - Node 18+ (global fetch)
 *   - Outgoing HTTPS access (to api.thevoterguide.org/auth.thevoterguide.org)
 *
 * Optional overrides:
 *   LOWV_CLIENT_ID, LOWV_CLIENT_SECRET, LOWV_API_SCOPE
 */

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { EMOJI, escapeCsvField } from './config'
import { NameMatcher } from '../../lib/normalize/names'
import { ADDITIONAL_CANDIDATE_ALIASES } from './2025-seats'

const prisma = new PrismaClient()

const AUTH_BASE = 'https://auth.thevoterguide.org'
const API_BASE = 'https://api.thevoterguide.org'
const CLIENT_ID =
  process.env.LOWV_CLIENT_ID ?? 'VOTE41122'
const CLIENT_SECRET =
  process.env.LOWV_CLIENT_SECRET ?? 'q3bKkWBVqcIBTfcp1ZguKoqhb_MrtCBjnmxL2SJ-YQ0'
const TOKEN_SCOPE =
  process.env.LOWV_API_SCOPE ?? 'target-entity:0f5c2a42-641d-4394-abd1-80a3f9ed3c1b'

const CATEGORY_ID = '39673771' // Washington state races

const PARTICIPATION_OUTPUT = 'scripts/import/lowv-responses.csv'
const RESPONSES_OUTPUT = 'scripts/import/lowv-questionnaire-responses.csv'
const UNMATCHED_OUTPUT = 'scripts/import/unmatched-lowv.txt'

const MUNICIPAL_PATTERNS = [
  /Kennewick/i,
  /Pasco/i,
  /Richland/i,
  /West Richland/i,
  /Port of Kennewick/i,
  /Port of Benton/i
]

interface Vote411Race {
  id: number
  name: string
  raceQuestionSet?: {
    raceQuestions?: Vote411Question[]
  }
}

interface Vote411Question {
  id: number
  body: string
  index: number
  translations?: Array<{ id: string; value: string }>
}

interface Vote411CandidateSummary {
  id: number
  name: string
  parties?: Array<{ name: string }>
  state?: {
    id: number
    name: string
  }
}

interface Vote411Answer {
  id: number
  raceQuestionId: number
  translations?: Array<{ id: string; value: string }>
}

type JsonRecord = Record<string, unknown>

class TokenManager {
  private token: string | null = null
  private expiresAt = 0

  async getToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.token && Date.now() < this.expiresAt - 60_000) {
      return this.token
    }
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`, 'utf8').toString('base64')

    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('scope', TOKEN_SCOPE)

    const response = await fetch(`${AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Basic ${credentials}`
      },
      body: params
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(
        `Failed to fetch Vote411 token (${response.status}): ${errorBody || response.statusText}`
      )
    }

    const data = (await response.json()) as {
      access_token: string
      expires_in: number
    }

    this.token = data.access_token
    this.expiresAt = Date.now() + data.expires_in * 1000
    return this.token!
  }
}

class Vote411Client {
  private tokenManager = new TokenManager()

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) {
          url.searchParams.append(key, value)
        }
      })
    }

    const makeRequest = async (force = false): Promise<Response> => {
      const token = await this.tokenManager.getToken(force)
      return fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
    }

    let response = await makeRequest()
    if (response.status === 401 || response.status === 403) {
      response = await makeRequest(true)
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(
        `Vote411 API error ${response.status} for ${url.toString()}${errorBody ? `: ${errorBody}` : ''}`
      )
    }

    return (await response.json()) as T
  }
}

const client = new Vote411Client()

async function fetchWashingtonRaces(): Promise<Vote411Race[]> {
  const races = await client.get<Vote411Race[]>(
    '/v1/race',
    {
      categoryId: CATEGORY_ID,
      limit: '2000'
    }
  )

  return races.filter(race =>
    MUNICIPAL_PATTERNS.some(pattern => pattern.test(race.name))
  )
}

async function fetchRaceDetail(raceId: number): Promise<Vote411Race | null> {
  try {
    return await client.get<Vote411Race>(`/v1/race/${raceId}`)
  } catch (error) {
    console.error(`${EMOJI.ERROR} Failed to fetch race detail for ${raceId}`, error)
    return null
  }
}

async function fetchCandidateSummaries(raceId: number): Promise<Vote411CandidateSummary[]> {
  return client.get('/v1/candidate', { raceId: String(raceId) })
}

async function fetchCandidateAnswers(candidateId: number): Promise<Vote411Answer[]> {
  return client.get(`/v1/candidates/${candidateId}/raceQuestions`)
}

function chooseTranslation(translations: Vote411Answer['translations'], locale = 'en'): string {
  if (!translations || translations.length === 0) {
    return ''
  }
  const exact = translations.find(entry => entry.id === locale)?.value
  if (exact && exact.trim().length > 0) {
    return exact.trim()
  }
  const fallback = translations[0]?.value
  return fallback ? fallback.trim() : ''
}

function buildRaceUrl(raceId: number): string {
  return `https://www.vote411.org/ballot?lwv-ballot-widget-raceid=${raceId}`
}

async function main() {
  console.log(`${EMOJI.SEARCH} Fetching Vote411 token and race list...`)

  const [dbCandidates, voteRaces] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        electionYear: 2025
      },
      include: {
        office: {
          include: {
            region: true
          }
        }
      }
    }),
    fetchWashingtonRaces()
  ])

  console.log(`${EMOJI.SUCCESS} Found ${voteRaces.length} Vote411 races matching Tri-Cities keywords`)

  const matcher = new NameMatcher()
  const candidateById = new Map<string, (typeof dbCandidates)[number]>()
  const candidateIdByName = new Map<string, string>()

  dbCandidates.forEach(candidate => {
    matcher.addKnownName(candidate.name, candidate.id)
    candidateById.set(candidate.id, candidate)
    candidateIdByName.set(candidate.name.toUpperCase(), candidate.id)
  })

  for (const [alias, canonical] of Object.entries(ADDITIONAL_CANDIDATE_ALIASES)) {
    const canonicalId = candidateIdByName.get(canonical.toUpperCase())
    if (canonicalId) {
      matcher.addAlias(canonicalId, alias)
    }
  }

  const participationRows: string[] = []
  const responseRows: string[] = []
  const unmatchedCandidates = new Set<string>()

  participationRows.push(
    'Candidate Name,Office,Region,Participated,Notes,Race URL'
  )
  responseRows.push(
    'Candidate Name,Office,Region,Question Order,Question,Answer,Language,Race URL'
  )

  for (const race of voteRaces) {
    console.log(`${EMOJI.PROCESSING} Processing Vote411 race: ${race.name} (${race.id})`)
    const raceUrl = buildRaceUrl(race.id)
    const raceDetail = await fetchRaceDetail(race.id)
    const raceQuestions = (raceDetail?.raceQuestionSet?.raceQuestions ?? []).sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0)
    )

    let candidateSummaries: Vote411CandidateSummary[] = []

    try {
      candidateSummaries = await fetchCandidateSummaries(race.id)
    } catch (error) {
      console.error(`${EMOJI.ERROR} Failed to fetch candidates for ${race.name}`, error)
      continue
    }

    for (const summary of candidateSummaries) {
      const cleanedName = summary.name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
      const candidateMatch = (() => {
        const primary = matcher.findMatch(cleanedName, 0.82)
        if (primary.source !== 'none') {
          return primary
        }
        return matcher.findMatch(summary.name, 0.82)
      })()
      if (candidateMatch.source === 'none') {
        unmatchedCandidates.add(`${summary.name} (race: ${race.name})`)
        continue
      }

      const candidateRecord = candidateById.get(candidateMatch.normalizedName)
      if (!candidateRecord) {
        unmatchedCandidates.add(`${summary.name} (race: ${race.name})`)
        continue
      }

      const officeTitle = candidateRecord.office.title
      const regionName = candidateRecord.office.region?.name ?? ''

      let answers: Vote411Answer[] = []

      try {
        answers = await fetchCandidateAnswers(summary.id)
      } catch (error) {
        console.error(`${EMOJI.ERROR} Failed to fetch race questions for ${summary.name}`, error)
      }

      const filteredAnswers = answers.filter(answer => {
        const english = chooseTranslation(answer.translations)
        return english.length > 0
      })

      const participated = filteredAnswers.length > 0

      participationRows.push([
        escapeCsvField(candidateRecord.name),
        escapeCsvField(officeTitle),
        escapeCsvField(regionName),
        participated ? 'TRUE' : 'FALSE',
        participated ? 'Provided Vote411 responses' : 'No Vote411 responses',
        escapeCsvField(raceUrl)
      ].join(','))

      if (!participated) {
        continue
      }

      const answerByQuestionId = new Map<number, Vote411Answer>(
        filteredAnswers.map(answer => [answer.raceQuestionId, answer])
      )

      for (const question of raceQuestions) {
        const answer = answerByQuestionId.get(question.id)
        if (!answer) {
          continue
        }

        const englishAnswer = chooseTranslation(answer.translations)
        if (!englishAnswer) {
          continue
        }

        const languageEntries = answer.translations ?? []

        languageEntries.forEach(entry => {
          const value = entry.value?.trim()
          if (!value) {
            return
          }

          responseRows.push([
            escapeCsvField(candidateRecord.name),
            escapeCsvField(officeTitle),
            escapeCsvField(regionName),
            String(question.index ?? 0),
            escapeCsvField(question.body ?? ''),
            escapeCsvField(value),
            escapeCsvField(entry.id ?? ''),
            escapeCsvField(raceUrl)
          ].join(','))
        })
      }
    }
  }

  fs.writeFileSync(PARTICIPATION_OUTPUT, `${participationRows.join('\n')}\n`, 'utf8')
  fs.writeFileSync(RESPONSES_OUTPUT, `${responseRows.join('\n')}\n`, 'utf8')

  console.log(`${EMOJI.SUCCESS} Participation saved to ${PARTICIPATION_OUTPUT}`)
  console.log(`${EMOJI.SUCCESS} Detailed responses saved to ${RESPONSES_OUTPUT}`)

  if (unmatchedCandidates.size > 0) {
    fs.writeFileSync(
      UNMATCHED_OUTPUT,
      Array.from(unmatchedCandidates).sort().join('\n'),
      'utf8'
    )
    console.log(`${EMOJI.WARNING} Unmatched Vote411 candidates written to ${UNMATCHED_OUTPUT}`)
  }

  await prisma.$disconnect()
}

main().catch(async error => {
  console.error(`${EMOJI.ERROR} Vote411 scraper failed`, error)
  await prisma.$disconnect()
  process.exit(1)
})

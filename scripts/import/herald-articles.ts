/**
 * Tri-City Herald candidate news search + relevance assessment.
 *
 * For each 2026 candidate: search the Herald (authenticated) for their name,
 * fetch each result's full text, and have Claude assess whether the article
 * tells voters something MEANINGFUL (skipping filler like "X files" / "X wins").
 *
 * Everything captured is appended to a JSONL cache (full text + assessment) so
 * runs are resumable, debuggable, and never re-fetch the same article. NO DB
 * writes yet — we look at the output first, then decide how it fits the design.
 *
 * Requires: scripts/import/herald-session.json (npm run import:letters:session)
 *           ANTHROPIC_API_KEY in .env
 *
 * Usage:
 *   npm run import:herald-articles                      # all 2026 candidates
 *   npm run import:herald-articles -- --only="John Duresky|Nikki Torres"
 *   npm run import:herald-articles -- --limit=5
 */
import 'dotenv/config'
import { chromium, Browser, Page } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import { CURRENT_ELECTION_TYPE, CURRENT_ELECTION_YEAR } from '../../lib/constants'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SESSION_PATH = 'scripts/import/herald-session.json'
const OUTPUT_JSONL = 'scripts/import/herald-articles.jsonl'
// Best-guess Herald on-site search endpoint (McClatchy). If the results page
// comes back empty, confirm the real URL by searching on tri-cityherald.com
// and updating this template — it's the one thing to verify on first run.
const SEARCH_URL = (term: string) =>
  `https://www.tri-cityherald.com/search/?q=${encodeURIComponent(term)}`
const STAGGER_MS = 10_000 // ~1 article page per 10s, per @adam
// The Herald's search ranks by relevance with no date filter, so it surfaces a
// long-serving candidate's coverage back to 2012. Article numbers only ever go
// up, and article313983288 was published 2025-12-29, so anything numbered below
// it predates this campaign. Override with --since-article=<number>.
const DEFAULT_SINCE_ARTICLE = 313_983_288

const args = process.argv.slice(2)
const onlyArg = args.find(a => a.startsWith('--only='))
const limitArg = args.find(a => a.startsWith('--limit='))
const sinceArticleArg = args.find(a => a.startsWith('--since-article='))
const SINCE_ARTICLE = sinceArticleArg
  ? parseInt(sinceArticleArg.slice('--since-article='.length), 10)
  : DEFAULT_SINCE_ARTICLE

function articleNumber(url: string): number {
  const match = url.match(/article(\d+)\.html/)
  return match ? parseInt(match[1], 10) : 0
}

interface CandidateTerm {
  id: string
  name: string
  searchTerms: string[]
  matchers: RegExp[]
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Fold diacritics to plain ASCII so accented Latino names match whether or not
// the Herald uses the accent ("Pooré" ⇄ "Poore", "Saavedra" etc.).
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// "First Last" key (folded, lowercased, middle names/initials/suffixes dropped)
// so an id lookup survives the model writing e.g. "Shawn Sant" for "Shawn P. Sant".
function firstLastKey(name: string): string {
  const toks = fold(name)
    .toLowerCase()
    .replace(/["“'()]|\bjr\.?\b|\bsr\.?\b|\bii\b|\biii\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  return toks.length >= 2 ? `${toks[0]} ${toks[toks.length - 1]}` : toks.join(' ')
}

/**
 * Derive search terms + middle-name-tolerant match patterns from a DB name.
 * Handles nicknames in quotes/parens: 'Jacek "Jack" Kobiesa', 'Michael (Mike) Clark'.
 */
function buildCandidateTerm(id: string, name: string, altNames: string[]): CandidateTerm {
  // Work in folded (ASCII) space so accents never block a match.
  const foldedName = fold(name)
  const nickname = (foldedName.match(/["“'(]([A-Za-z.\- ]+)[")”']/) || [])[1]?.trim()
  const cleaned = foldedName.replace(/["“'()]|\bJr\.?\b|\bSr\.?\b|\bII\b|\bIII\b/g, ' ').replace(/\s+/g, ' ').trim()
  const tokens = cleaned.split(' ').filter(Boolean)
  const first = tokens[0]
  const last = tokens[tokens.length - 1]

  const firsts = Array.from(new Set([first, nickname].filter(Boolean))) as string[]
  const searchTerms = Array.from(new Set([
    ...firsts.map(f => `${f} ${last}`),
    ...altNames.map(fold),
  ].filter(Boolean)))

  // Match: <first> then up to 2 optional middle tokens then <last>
  const matchers = firsts.map(f =>
    new RegExp(`\\b${escapeRegex(f)}\\b(?:\\s+[A-Z][A-Za-z.'-]*){0,2}\\s+\\b${escapeRegex(last)}\\b`, 'i')
  )
  return { id, name, searchTerms, matchers }
}

function loadAltNames(): Map<string, string[]> {
  const map = new Map<string, string[]>()
  try {
    const cfg = JSON.parse(fs.readFileSync('legacy/data/json/load-config-names.json', 'utf8'))
    for (const entry of cfg) {
      if (entry.formattedName && Array.isArray(entry.altNames)) {
        map.set(entry.formattedName, entry.altNames.map((a: string) => a.replace(/\(.*\)/, '').trim()).filter(Boolean))
      }
    }
  } catch {
    /* config optional */
  }
  return map
}

function loadSeenUrls(): Set<string> {
  const seen = new Set<string>()
  if (!fs.existsSync(OUTPUT_JSONL)) return seen
  for (const line of fs.readFileSync(OUTPUT_JSONL, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try { seen.add(JSON.parse(line).url) } catch { /* skip */ }
  }
  return seen
}

const RELEVANCE_PROMPT = (candidateList: string, articleText: string) => `You are curating news coverage for a nonpartisan voter guide. Decide whether this article tells voters something MEANINGFUL about a specific candidate or candidates — their positions, actions, record, character, controversies, or notable activities.

INCLUDE if it does any of: reports a candidate taking a position on an issue; covers something substantive they did or said; describes a controversy/investigation/conflict involving them; gives human-interest insight into who they are; analyzes their campaign, record, or fitness for office.

EXCLUDE (filler) if it is only: a routine "files/announces/enters race" notice; a bare "X wins/advances" result; a candidate list / forum schedule / logistics; a passing mention where the candidate is not really the subject; or an endorsement letter.

Candidates to consider (match a candidate even if a middle name/initial is added or dropped): ${candidateList}

For each candidate the article meaningfully covers, return a JSON array of objects:
{ "candidateName": <exact name from the list>, "include": true|false, "category": "position"|"action"|"controversy"|"human-interest"|"analysis"|"filler", "reason": <one sentence> }
Return ONLY the JSON array. If nothing meaningful about any listed candidate, return [].

Article text:
${articleText}`

async function fetchArticleText(page: Page, url: string): Promise<{ title: string; text: string } | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(1500)
    const title = (await page.title().catch(() => '')) || ''
    const text = await page.evaluate(() => {
      const article = document.querySelector('article') || document.body
      const els = article.querySelectorAll('h1, h2, p')
      return Array.from(els).map(el => el.textContent?.trim()).filter(Boolean).join('\n\n')
    })
    return text ? { title, text: text.slice(0, 8000) } : null
  } catch (e) {
    console.log(`   ⚠️  fetch failed: ${(e as Error).message?.slice(0, 80)}`)
    return null
  }
}

async function searchCandidate(page: Page, term: string): Promise<string[]> {
  try {
    await page.goto(SEARCH_URL(term), { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    // Only the result cards: the page also carries trending and syndicated
    // links (celebrity stories and the like) that have nothing to do with the query
    const urls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.package a[href*="/article"], .card a[href*="/article"]'))
        .map(a => (a as HTMLAnchorElement).href.split('#')[0])
        .filter((v, i, arr) => arr.indexOf(v) === i)
    )
    return urls.filter(u => articleNumber(u) >= SINCE_ARTICLE)
  } catch (e) {
    console.log(`   ⚠️  search failed for "${term}": ${(e as Error).message?.slice(0, 80)}`)
    return []
  }
}

async function assess(candidateList: string, text: string): Promise<any[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: RELEVANCE_PROMPT(candidateList, text) }],
  })
  const block = message.content.find(b => b.type === 'text')
  const raw = block && block.type === 'text' ? block.text : ''
  const m = raw.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || raw.match(/(\[[\s\S]*\])/)
  try { return m ? JSON.parse(m[1]) : [] } catch { return [] }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing (.env)')
  if (!fs.existsSync(SESSION_PATH)) throw new Error(`No Herald session — run: npm run import:letters:session`)

  const altNameMap = loadAltNames()
  // Candidates eliminated in the primary are no longer in the guide
  let candidates = await prisma.candidate.findMany({
    where: {
      electionYear: CURRENT_ELECTION_YEAR,
      races: { some: { race: { type: CURRENT_ELECTION_TYPE } } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  if (onlyArg) {
    const names = onlyArg.slice('--only='.length).split('|').map(s => s.trim().toLowerCase())
    candidates = candidates.filter(c => names.includes(c.name.toLowerCase()))
  }
  if (limitArg) candidates = candidates.slice(0, parseInt(limitArg.slice('--limit='.length), 10) || candidates.length)

  const terms = candidates.map(c => buildCandidateTerm(c.id, c.name, altNameMap.get(c.name) ?? []))
  const nameToId = new Map(terms.map(t => [t.name, t.id]))
  const idByFirstLast = new Map(terms.map(t => [firstLastKey(t.name), t.id]))
  const resolveId = (candidateName: string): string | null =>
    nameToId.get(candidateName) ?? idByFirstLast.get(firstLastKey(candidateName)) ?? null
  console.log(`🔍 ${terms.length} candidates; searching Herald...`)

  // The Herald blocks headless browsers, so this runs a real window, parked
  // off-screen so the scheduled job doesn't flash articles across the desktop
  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--window-position=-3000,-3000'],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 1000 },
    storageState: SESSION_PATH,
  })
  const page = await context.newPage()

  // Discovery: map each article URL to the candidates whose search surfaced it.
  const urlToCandidates = new Map<string, Set<string>>()
  for (const t of terms) {
    for (const term of t.searchTerms) {
      const urls = await searchCandidate(page, term)
      for (const u of urls) {
        if (!urlToCandidates.has(u)) urlToCandidates.set(u, new Set())
        urlToCandidates.get(u)!.add(t.name)
      }
      await page.waitForTimeout(2000)
    }
    console.log(`  ${t.name}: search done`)
  }

  const seen = loadSeenUrls()
  const toProcess = [...urlToCandidates.keys()].filter(u => !seen.has(u))
  console.log(`\n📄 ${urlToCandidates.size} unique articles found, ${toProcess.length} new to process\n`)

  for (const url of toProcess) {
    console.log(`📖 ${url}`)
    const fetched = await fetchArticleText(page, url)
    if (!fetched) { await page.waitForTimeout(STAGGER_MS); continue }

    // Confirm which candidates actually appear in the text (middle-name +
    // diacritic tolerant — both name and text are folded to ASCII)
    const foldedText = fold(fetched.text)
    const matchedTerms = terms.filter(t => t.matchers.some(re => re.test(foldedText)))
    const matched = matchedTerms.map(t => t.name)
    const candidatesForAssessment = matched.length ? matched : [...(urlToCandidates.get(url) ?? [])]

    let assessment: any[] = []
    if (candidatesForAssessment.length) {
      assessment = await assess(candidatesForAssessment.join(', '), fetched.text)
      // Normalize each assessment item back to a DB candidate id.
      assessment = assessment.map(a => ({ ...a, candidateId: resolveId(a.candidateName) }))
      const kept = assessment.filter(a => a.include)
      console.log(`   matched: ${matched.join(', ') || '(search-only)'} | kept: ${kept.map(k => k.candidateName).join(', ') || 'none'}`)
    }

    const record = {
      url,
      title: fetched.title,
      text: fetched.text,
      matchedCandidates: matched,
      matchedCandidateIds: matchedTerms.map(t => t.id),
      searchedCandidates: [...(urlToCandidates.get(url) ?? [])],
      assessment,
      capturedAt: new Date().toISOString(),
    }
    fs.appendFileSync(OUTPUT_JSONL, JSON.stringify(record) + '\n')

    await page.waitForTimeout(STAGGER_MS)
  }

  await browser.close()
  await prisma.$disconnect()
  console.log(`\n✅ Done. Full captures in ${OUTPUT_JSONL}`)
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

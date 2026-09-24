/**
 * Deep links to one letter inside a Tri-City Herald letters page.
 *
 * The Herald publishes letters to the editor in batches: one article page, one
 * headline, several letters each under its own subheading and signed with the
 * writer's name and town. A plain link lands on the batch headline, which is
 * usually about someone else's letter. The letters have no anchors, so the link
 * carries a text fragment (#:~:text=) naming the letter's own subheading, which
 * browsers scroll to and highlight.
 */
import type { Page } from 'playwright'

export interface LetterSection {
  title: string
  paragraphs: string[]
}

/** Split a letters page into one section per letter subheading. */
export async function extractLetterSections(page: Page): Promise<LetterSection[]> {
  return page.evaluate(() => {
    const article = document.querySelector('article')
    if (!article) return []
    const sections: Array<{ title: string; paragraphs: string[] }> = []
    for (const el of Array.from(article.querySelectorAll('h2, p'))) {
      const text = (el.textContent || '').trim()
      if (!text) continue
      if (el.tagName === 'H2') sections.push({ title: text, paragraphs: [] })
      else if (sections.length) sections[sections.length - 1].paragraphs.push(text)
    }
    return sections
  })
}

function nameTokens(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/\b(sen|rep|dr|mr|mrs|ms)\.?\s+/g, '')
    .split(/[^a-z']+/)
    .filter(token => token.length > 1)
}

/**
 * The section whose sign-off names the writer. A signature is a short
 * paragraph ("Greg Carl, Richland"), so long paragraphs that merely mention
 * the name don't count.
 */
export function findWritersLetter(sections: LetterSection[], writer: string): LetterSection | null {
  const wanted = nameTokens(writer)
  if (wanted.length === 0) return null
  const first = wanted[0]
  const last = wanted[wanted.length - 1]
  for (const section of sections) {
    const signed = section.paragraphs.some(paragraph => {
      if (paragraph.length > 120) return false
      const tokens = nameTokens(paragraph)
      return tokens.includes(first) && tokens.includes(last)
    })
    if (signed) return section
  }
  return null
}

/** The letter's URL with a text fragment for its subheading, or the URL unchanged. */
export function letterDeepLink(url: string, sections: LetterSection[], writer: string): string {
  const base = url.split('#')[0]
  const letter = findWritersLetter(sections, writer)
  if (!letter) return base
  // "-" and "," delimit prefix/suffix inside a text fragment, so both must be escaped
  const text = encodeURIComponent(letter.title).replace(/-/g, '%2D')
  return `${base}#:~:text=${text}`
}

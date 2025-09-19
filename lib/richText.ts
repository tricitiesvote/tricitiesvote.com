import { markdownToHtmlSync } from './markdown'

const HTML_TAG_REGEX = /<[^>]+>/

export function ensureHtml(content?: string | null): string | null {
  if (!content) {
    return null
  }

  const trimmed = content.trim()

  if (!trimmed) {
    return null
  }

  if (HTML_TAG_REGEX.test(trimmed)) {
    return trimmed
  }

  return markdownToHtmlSync(trimmed)
}

export type MeasureStance = 'support' | 'oppose'

const SUPPORT_KEYWORDS = /\b(yes|approve|for|support)\b/i
const OPPOSITION_KEYWORDS = /\b(no|reject|against|oppose)\b/i

export function deriveMeasureStance(name: string): MeasureStance | null {
  const normalized = name.toLowerCase()

  if (SUPPORT_KEYWORDS.test(normalized)) {
    return 'support'
  }

  if (OPPOSITION_KEYWORDS.test(normalized)) {
    return 'oppose'
  }

  return null
}

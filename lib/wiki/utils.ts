export function getWikiValue<T extends Record<string, any>, K extends keyof T & string>(
  entity: T,
  field: K
): T[K] | null {
  if (!entity) return null

  const baseValue = entity[field]
  const wikiKey = `${field}Wiki`

  if (wikiKey in entity) {
    const wikiValue = entity[wikiKey as keyof T]
    if (wikiValue !== null && wikiValue !== undefined && wikiValue !== '') {
      return wikiValue as T[K]
    }
  }

  if (baseValue === '' || baseValue === undefined) {
    return null
  }

  return (baseValue ?? null) as T[K] | null
}

export function hasWikiOverride<T extends Record<string, any>, K extends keyof T & string>(
  entity: T,
  field: K
): boolean {
  const wikiKey = `${field}Wiki`
  if (!(wikiKey in entity)) return false
  const override = entity[wikiKey as keyof T]
  return override !== null && override !== undefined && override !== ''
}

export function preferWikiString<T extends Record<string, any>, K extends keyof T & string>(
  entity: T,
  field: K
): string | null {
  const value = getWikiValue(entity, field)
  return typeof value === 'string' ? value : value !== null && value !== undefined ? String(value) : null
}

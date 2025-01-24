import { distance } from 'fastest-levenshtein'

export interface NameMatchResult {
  normalizedName: string
  confidence: number
  source: 'exact' | 'fuzzy' | 'none'
}

export class NameMatcher {
  private normalizedNames: Map<string, string> = new Map()
  private aliasMap: Map<string, Set<string>> = new Map()
  
  addKnownName(name: string, normalizedForm: string) {
    const normalized = this.normalize(name)
    this.normalizedNames.set(normalized, normalizedForm)
    
    // Initialize alias set if it doesn't exist
    if (!this.aliasMap.has(normalizedForm)) {
      this.aliasMap.set(normalizedForm, new Set())
    }
    
    // Add this variant to the alias set
    this.aliasMap.get(normalizedForm)!.add(name)
  }

  addAlias(normalizedForm: string, alias: string) {
    if (!this.aliasMap.has(normalizedForm)) {
      this.aliasMap.set(normalizedForm, new Set())
    }
    this.aliasMap.get(normalizedForm)!.add(alias)
    this.normalizedNames.set(this.normalize(alias), normalizedForm)
  }

  findMatch(name: string, threshold = 0.85): NameMatchResult {
    const normalized = this.normalize(name)
    
    // First check exact matches in our known names
    if (this.normalizedNames.has(normalized)) {
      return {
        normalizedName: this.normalizedNames.get(normalized)!,
        confidence: 1,
        source: 'exact'
      }
    }

    // Then try fuzzy matching
    let bestMatch: string | null = null
    let bestScore = 0

    for (const [knownName, normalizedForm] of this.normalizedNames) {
      const score = this.similarity(normalized, knownName)
      if (score > threshold && score > bestScore) {
        bestScore = score
        bestMatch = normalizedForm
      }
    }

    if (bestMatch) {
      return {
        normalizedName: bestMatch,
        confidence: bestScore,
        source: 'fuzzy'
      }
    }

    return {
      normalizedName: name,
      confidence: 0,
      source: 'none'
    }
  }

  getAliases(normalizedName: string): string[] {
    return Array.from(this.aliasMap.get(normalizedName) || [])
  }

  private normalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
      .trim()
  }

  private similarity(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length)
    const editDistance = distance(a, b)
    return 1 - (editDistance / maxLength)
  }
}
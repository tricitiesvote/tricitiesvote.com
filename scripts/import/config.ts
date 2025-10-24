/**
 * Shared configuration for import scripts
 *
 * This module provides centralized configuration and utilities for data import scripts,
 * including feature flags for safe development and testing.
 */

/**
 * Import mode configuration
 * - 'csv': Write to CSV files only (safe for development)
 * - 'db': Write directly to database (production mode)
 *
 * Can be overridden via environment variable: IMPORT_MODE=db
 */
export const IMPORT_MODE = (process.env.IMPORT_MODE || 'csv') as 'csv' | 'db'

/**
 * Check if we're in dry-run mode (CSV output only)
 */
export function isDryRun(): boolean {
  return IMPORT_MODE === 'csv' || process.argv.includes('--dry-run')
}

/**
 * Get the output mode with clear messaging
 */
export function getOutputMode(): { mode: 'csv' | 'db'; message: string } {
  const dryRun = isDryRun()
  return {
    mode: dryRun ? 'csv' : 'db',
    message: dryRun
      ? '🔒 DRY RUN MODE - Writing to CSV only (use IMPORT_MODE=db or remove --dry-run to enable database writes)'
      : '⚠️  DATABASE MODE - Will write directly to database'
  }
}

/**
 * Standard rate limiting delays (in milliseconds)
 */
export const RATE_LIMITS = {
  /** Delay between AI API calls */
  AI_CALLS: 1000,

  /** Delay between page loads for standard sites */
  PAGE_LOADS: 2000,

  /** Delay between page loads for Wix sites (need longer waits) */
  WIX_LOADS: 3000,

  /** Initial page wait for dynamic content */
  INITIAL_WAIT: 3000,
}

/**
 * Standard emoji vocabulary for consistent output
 */
export const EMOJI = {
  SEARCH: '🔍',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
  INFO: 'ℹ️',
  SKIP: '⏭️',
  SUMMARY: '📊',
  PROCESSING: '📖',
  ROBOT: '🤖',
  SAVE: '💾',
}

/**
 * CSV escaping helper - handles commas and quotes in CSV fields
 */
export function escapeCsvField(value: string | undefined | null): string {
  if (!value) return ''

  // If the value contains commas, quotes, or newlines, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

/**
 * Parse CSV line handling quoted fields with commas
 */
export function parseCsvLine(line: string, expectedColumns: number): string[] | null {
  const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)

  if (!matches || matches.length < expectedColumns) {
    return null
  }

  return matches.map(field =>
    field.replace(/^,?"?|"?$/g, '').replace(/""/g, '"')
  )
}

/**
 * Parse CSV file with proper handling of multi-line quoted fields
 * Returns array of lines where each line represents a complete CSV row
 */
export function parseCsvFile(csvContent: string): string[] {
  const lines: string[] = []
  let currentLine = ''
  let inQuotes = false

  // Handle multi-line quoted fields
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i]
    currentLine += char

    if (char === '"') {
      // Check if it's an escaped quote
      if (csvContent[i + 1] === '"') {
        currentLine += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine.trim())
      currentLine = ''
    }
  }

  // Add final line if exists
  if (currentLine.trim()) {
    lines.push(currentLine.trim())
  }

  return lines
}

/**
 * Generate a deterministic slug for engagement deduplication
 * Combines title and date into a URL-safe string
 */
export function generateEngagementSlug(title: string, date?: Date | string): string {
  const dateStr = date
    ? (typeof date === 'string' ? date : date.toISOString().split('T')[0])
    : 'undated'

  const slug = `${title}-${dateStr}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) // Limit length

  return slug
}

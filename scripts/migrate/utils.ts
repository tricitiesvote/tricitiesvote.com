import * as path from 'path'
import * as fs from 'fs/promises'

/**
 * Safely reads and parses a JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as T
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error}`)
  }
}

/**
 * Ensures a directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Normalizes a candidate name for matching
 */
export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim()
}

/**
 * Handles image paths, optionally copying to a new location
 */
export async function processImagePath(
  imagePath: string | null | undefined,
  year: number,
  candidateSlug: string
): Promise<string | null> {
  if (!imagePath) return null
  
  // For now, just return the original path
  // TODO: Implement image copying/processing if needed
  return imagePath
}

/**
 * Validates a year is within our expected range
 */
export function validateYear(year: number): void {
  if (year < 2020 || year > 2023) {
    throw new Error(`Invalid year: ${year}. Must be between 2020 and 2023`)
  }
} 
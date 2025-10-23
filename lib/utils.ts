// Helper functions for the frontend

export function getYearType(year: number): 'municipal' | 'county' {
  return year % 2 === 1 ? 'municipal' : 'county'
}

export function getGuideRegionsForYear(year: number): string[] {
  const yearType = getYearType(year)
  return yearType === 'municipal'
    ? ['Kennewick', 'Pasco', 'Richland', 'West Richland', 'Benton County']
    : ['Benton County', 'Franklin County']
}

/**
 * Remove diacritics from text (José → Jose, María → Maria)
 */
function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function slugify(text: string): string {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/'/g, '')              // Remove apostrophes (O'Neil → oneil)
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '')        // Remove non-word characters except hyphens
    .replace(/--+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+/, '')             // Remove leading hyphens
    .replace(/-+$/, '')             // Remove trailing hyphens
}

export function unslugify(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}

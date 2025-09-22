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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
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

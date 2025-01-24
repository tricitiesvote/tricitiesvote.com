import * as cheerio from 'cheerio'

interface ElectionDate {
  type: 'PRIMARY' | 'GENERAL'
  date: Date
  year: number
}

export class ElectionCalendarClient {
  private baseUrl = 'https://www.sos.wa.gov/elections/calendars.aspx'

  async getElectionDates(year: number): Promise<ElectionDate[]> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch election calendar')
    }

    const html = await response.text()
    return this.parseCalendar(html, year)
  }

  private parseCalendar(html: string, targetYear: number): ElectionDate[] {
    const $ = cheerio.load(html)
    const dates: ElectionDate[] = []

    // The calendar typically has tables for each year
    $('table').each((_, table) => {
      const yearText = $(table).find('caption').text()
      const year = this.extractYear(yearText)

      if (year === targetYear) {
        $(table).find('tr').each((_, row) => {
          const text = $(row).text().toLowerCase()
          
          if (text.includes('primary')) {
            const date = this.extractDate(text, year)
            if (date) {
              dates.push({ type: 'PRIMARY', date, year })
            }
          } else if (text.includes('general')) {
            const date = this.extractDate(text, year)
            if (date) {
              dates.push({ type: 'GENERAL', date, year })
            }
          }
        })
      }
    })

    return dates
  }

  private extractYear(text: string): number {
    const match = text.match(/\d{4}/)
    return match ? parseInt(match[0], 10) : new Date().getFullYear()
  }

  private extractDate(text: string, year: number): Date | null {
    // Handle various date formats
    const monthDay = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}/i)
    if (monthDay) {
      return new Date(`${monthDay[0]}, ${year}`)
    }
    return null
  }
}
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CURRENT_ELECTION_YEAR } from '@/lib/constants'

interface YearLayoutProps {
  children: React.ReactNode
  params: { year: string }
}

export default function YearLayout({ children, params }: YearLayoutProps) {
  const parsedYear = Number.parseInt(params.year, 10)
  const currentYear = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear()
  const displayYear = currentYear === CURRENT_ELECTION_YEAR ? currentYear : CURRENT_ELECTION_YEAR

  return (
    <>
      <Header currentYear={displayYear} />
      <main>{children}</main>
      <Footer />
    </>
  )
}

import { getAvailableYears } from '@/lib/queries'
import { YearToggle } from '@/components/YearToggle'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface YearLayoutProps {
  children: React.ReactNode
  params: { year: string }
}

export default async function YearLayout({ children, params }: YearLayoutProps) {
  const currentYear = parseInt(params.year)
  const availableYears = await getAvailableYears()

  return (
    <div className="year-layout">
      <Header>
        <YearToggle currentYear={currentYear} availableYears={availableYears} />
      </Header>
      <main>{children}</main>
      <Footer />
    </div>
  )
}
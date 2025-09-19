import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface YearLayoutProps {
  children: React.ReactNode
  params: { year: string }
}

export default function YearLayout({ children, params }: YearLayoutProps) {
  const parsedYear = Number.parseInt(params.year, 10)
  const currentYear = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear()

  return (
    <>
      <Header currentYear={currentYear} />
      <main>{children}</main>
      <Footer />
    </>
  )
}

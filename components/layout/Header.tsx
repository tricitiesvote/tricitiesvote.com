import Link from 'next/link'

interface HeaderProps {
  currentYear: number
}

const CITY_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Kennewick', href: '/kennewick' },
  { label: 'Richland', href: '/richland' },
  { label: 'Pasco', href: '/pasco' },
  { label: 'West Richland', href: '/west-richland' },
]

const COUNTY_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Benton', href: '/benton' },
  { label: 'Franklin', href: '/franklin' },
]

export function Header({ currentYear }: HeaderProps) {
  const navLinks = currentYear % 2 === 0 ? COUNTY_LINKS : CITY_LINKS

  return (
      <nav className="site-nav">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
  )
}

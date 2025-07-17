import Link from 'next/link'

interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="main-header">
      <div className="header-content">
        <Link href="/" className="logo">
          <h1>Tri-Cities Vote</h1>
        </Link>
        
        <nav className="main-nav">
          <Link href="/about">About</Link>
        </nav>
        
        {children}
      </div>
    </header>
  )
}
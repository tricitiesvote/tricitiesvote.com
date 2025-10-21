interface OgHeaderProps {
  title: string
  subtitle?: string
  kicker?: string
}

export function OgHeader({ title, subtitle, kicker = '🗳️ Tri-Cities Vote' }: OgHeaderProps) {
  return (
    <header className="og-header">
      <p className="og-kicker">{kicker}</p>
      <p className="og-subtitle">A non-partisan, community-driven collection of information to help you decide</p>
      <h1 className="og-title">{title}</h1>
      {subtitle ? <p className="og-tagline">{subtitle}</p> : null}
    </header>
  )
}

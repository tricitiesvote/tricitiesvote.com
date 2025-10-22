interface OgHeaderProps {
  title: string
  subtitle?: string
  kicker?: string
}

export function OgHeader({ title, subtitle, kicker = '🗳️ Tri-Cities Vote' }: OgHeaderProps) {
  return (
    <header className="og-header">
      <p className="og-kicker">{kicker}</p>
      <h1 className="og-title">{title}</h1>
    </header>
  )
}

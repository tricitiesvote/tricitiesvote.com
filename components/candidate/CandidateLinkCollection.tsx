interface CandidateLinkCollectionProps {
  email?: string | null
  website?: string | null
  facebook?: string | null
  twitter?: string | null
  instagram?: string | null
  youtube?: string | null
  pdc?: string | null
}

export function CandidateLinkCollection({
  email,
  website,
  facebook,
  twitter,
  instagram,
  youtube,
  pdc
}: CandidateLinkCollectionProps) {
  const links = [
    { href: email ? `mailto:${email}` : null, label: 'Email', icon: '✉️' },
    { href: website, label: 'Website', icon: '🌐' },
    { href: facebook, label: 'Facebook', icon: '👤' },
    { href: twitter, label: 'Twitter', icon: '🐦' },
    { href: instagram, label: 'Instagram', icon: '📷' },
    { href: youtube, label: 'YouTube', icon: '📺' },
    { href: pdc, label: 'Finance', icon: '💰' },
  ].filter(link => link.href)
  
  if (links.length === 0) {
    return (
      <div className="candidate-links empty">
        <p>Contact info N/A.</p>
      </div>
    )
  }

  return (
    <ul className="candidate-links">
      {links.map((link, index) => (
        <li key={index}>
          <span>{link.icon}</span>
          <a 
            href={link.href!} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

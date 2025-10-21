import { OgAvatar } from './OgAvatar'

interface OgCompetitorCardProps {
  name: string
  imageUrl?: string | null
  caption?: string
  fallbackLabel?: string
}

export function OgCompetitorCard({ name, imageUrl, caption, fallbackLabel }: OgCompetitorCardProps) {
  return (
    <div className="og-competitor">
      <OgAvatar name={name} imageUrl={imageUrl} fallbackLabel={fallbackLabel} />
      <p className="og-competitor-name">{name}</p>
      {caption ? <p className="og-competitor-caption">{caption}</p> : null}
    </div>
  )
}

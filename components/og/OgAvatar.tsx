import Image from 'next/image'

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]!.toUpperCase())
    .slice(0, 2)
    .join('')
}

interface OgAvatarProps {
  name: string
  imageUrl?: string | null
  fallbackLabel?: string
}

export function OgAvatar({ name, imageUrl, fallbackLabel }: OgAvatarProps) {
  const label = fallbackLabel ?? getInitials(name)
  const size = 200
  const isRemoteImage = imageUrl ? /^https?:/i.test(imageUrl) : false

  return (
    <div className="og-avatar">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized={isRemoteImage}
        />
      ) : (
        <div className="candidate-no-image">
          <span>{label}</span>
        </div>
      )}
    </div>
  )
}

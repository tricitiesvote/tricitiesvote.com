import Image from 'next/image'
import Link from 'next/link'

interface CandidateImageProps {
  name: string
  image?: string | null
  url: string
  size?: number
  badge?: {
    label: string
    backgroundColor?: string
  } | null
}

export function CandidateImage({ name, image, url, size = 150, badge }: CandidateImageProps) {
  const isRemoteImage = image ? /^https?:/i.test(image) : false
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  const fontSize = Math.floor(size * 0.32) // Scale font size relative to image size
  const badgeColor = badge?.backgroundColor ?? '#53bce4'

  return (
    <Link href={url}>
      {badge ? (
        <div
          className="candidate-measure-badge"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: badgeColor
          }}
        >
          <span style={{ fontSize: `${Math.floor(size * 0.33)}px` }}>
            {badge.label}
          </span>
        </div>
      ) : image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized={isRemoteImage}
        />
      ) : (
        <div
          className="candidate-no-image"
          style={{
            width: `${size}px`,
            height: `${size}px`
          }}
        >
          <span style={{ fontSize: `${fontSize}px` }}>
            {initials}
          </span>
        </div>
      )}
    </Link>
  )
}

import Image from 'next/image'
import Link from 'next/link'

interface CandidateImageProps {
  name: string
  image?: string | null
  url: string
  size?: number
}

export function CandidateImage({ name, image, url, size = 150 }: CandidateImageProps) {
  return (
    <Link href={url}>
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized={/^https?:/i.test(image)}
        />
      ) : (
        <div className="candidate-no-image">
          <span>{name.split(' ').map(n => n[0]).join('')}</span>
        </div>
      )}
    </Link>
  )
}

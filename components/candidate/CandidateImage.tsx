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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          width={size}
          height={size}
        />
      ) : (
        <div className="candidate-no-image">
          <span>{name.split(' ').map(n => n[0]).join('')}</span>
        </div>
      )}
    </Link>
  )
}

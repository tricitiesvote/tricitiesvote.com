import Image from 'next/image'
import Link from 'next/link'

interface CandidateImageProps {
  name: string
  image?: string | null
  url: string
}

export function CandidateImage({ name, image, url }: CandidateImageProps) {
  return (
    <Link href={url}>
      {image ? (
        <Image
          src={image}
          alt={name}
          width={150}
          height={150}
          sizes="150px"
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

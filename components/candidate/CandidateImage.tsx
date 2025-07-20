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
        <img 
          src={image} 
          alt={name}
          width={150}
          height={150}
        />
      ) : (
        <div className="candidate-no-image">
          <span>{name.split(' ').map(n => n[0]).join('')}</span>
        </div>
      )}
    </Link>
  )
}
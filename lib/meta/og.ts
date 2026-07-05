import type { Metadata } from 'next'

const SITE_NAME = 'Tri-Cities Vote'
const DEFAULT_DESCRIPTION = 'Nonpartisan voter guides for Tri-Cities elections'
const FALLBACK_IMAGE = '/compare.png'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tricitiesvote.com'

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, BASE_URL).toString()
}

function resolveImageUrl(relativePath?: string | null) {
  if (!relativePath) {
    return toAbsoluteUrl(FALLBACK_IMAGE)
  }

  // public/ assets are served from the CDN and deliberately excluded from
  // function bundles, so the path can't be checked on disk here; trust it.
  const sanitized = relativePath.replace(/^\/+/, '')
  return toAbsoluteUrl(`/${sanitized}`)
}

interface CreateOgMetadataOptions {
  title: string
  description?: string | null
  canonicalPath: string
  imagePath?: string | null
  type?: 'website' | 'article' | 'book' | 'profile' | null
}

export async function createOgMetadata({
  title,
  description,
  canonicalPath,
  imagePath,
  type = 'website'
}: CreateOgMetadataOptions): Promise<Metadata> {
  const metaDescription = description ?? DEFAULT_DESCRIPTION
  const imageUrl = resolveImageUrl(imagePath)
  const canonicalUrl = toAbsoluteUrl(canonicalPath)

  return {
    title,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description: metaDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      ...(type && { type }),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: [imageUrl]
    }
  }
}

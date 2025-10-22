import path from 'node:path'
import { promises as fs } from 'node:fs'
import type { Metadata } from 'next'

const SITE_NAME = 'Tri-Cities Vote'
const DEFAULT_DESCRIPTION = 'Nonpartisan voter guides for Tri-Cities elections'
const FALLBACK_IMAGE = '/compare.png'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tricitiesvote.com'

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, BASE_URL).toString()
}

async function resolveImageUrl(relativePath?: string | null) {
  if (!relativePath) {
    return toAbsoluteUrl(FALLBACK_IMAGE)
  }

  const sanitized = relativePath.replace(/^\/+/, '')

  // All images should be checked in filesystem (even OG images are pre-generated PNGs)
  const target = path.join(process.cwd(), 'public', sanitized)

  try {
    await fs.access(target)
    return toAbsoluteUrl(`/${sanitized}`)
  } catch {
    // In production, OG images might not exist yet if build failed
    // Still return the path so it can be generated on-demand
    if (sanitized.startsWith('og/')) {
      console.warn(`OG image not found at ${target}, using path anyway: /${sanitized}`)
      return toAbsoluteUrl(`/${sanitized}`)
    }
    return toAbsoluteUrl(FALLBACK_IMAGE)
  }
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
  const imageUrl = await resolveImageUrl(imagePath)
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

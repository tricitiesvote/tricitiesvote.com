import { redirect } from 'next/navigation'
import { getLatestYear } from '@/lib/queries'
import { slugify } from '@/lib/utils'

export async function redirectToRegion(regionName: string) {
  const year = await getLatestYear()
  redirect(`/${year}/guide/${slugify(regionName)}`)
}

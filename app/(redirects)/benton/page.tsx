import { redirectToRegion } from '../regionRedirect'

export default async function BentonRedirectPage() {
  await redirectToRegion('Benton County')
}

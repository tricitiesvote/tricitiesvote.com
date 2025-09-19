import { redirectToRegion } from '../regionRedirect'

export default async function FranklinRedirectPage() {
  await redirectToRegion('Franklin County')
}

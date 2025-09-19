import type { Metadata } from 'next'
import '../styles/globals.css'
import { ServiceWorkerCleanup } from '@/components/ServiceWorkerCleanup'

export const metadata: Metadata = {
  title: 'Tri-Cities Vote',
  description: 'Nonpartisan voter guides for Tri-Cities elections',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  )
}

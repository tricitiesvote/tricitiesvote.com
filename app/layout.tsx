import type { Metadata } from 'next'
import '../styles/globals.css'
import '../styles/ui.css'
import { ServiceWorkerCleanup } from '@/components/ServiceWorkerCleanup'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { EditModeProvider } from '@/lib/wiki/EditModeProvider'
import { EditModeButton } from '@/components/wiki/EditModeButton'

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
        <AuthProvider>
          <EditModeProvider>
            <ServiceWorkerCleanup />
            <EditModeButton />
            {children}
          </EditModeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

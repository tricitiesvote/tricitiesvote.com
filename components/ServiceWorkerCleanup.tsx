'use client'

import { useEffect } from 'react'

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        registrations.forEach(registration => {
          registration.unregister().catch(() => {
            // Ignore individual unregister failures; browser will try again later.
          })
        })
      })
      .catch(() => {
        // Ignore errors retrieving registrations
      })
  }, [])

  return null
}

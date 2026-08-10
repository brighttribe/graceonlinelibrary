'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void }
  }
}

export default function NotFoundTracker() {
  useEffect(() => {
    window.posthog?.capture('404_hit', {
      path: window.location.pathname,
      referrer: document.referrer || null,
    })
  }, [])

  return null
}

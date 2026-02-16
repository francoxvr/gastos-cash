'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope)
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error)
        })
    }
  }, [])

  return null
}
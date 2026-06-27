"use client"

import { useEffect, useState } from "react"
import { Download, Share, X, SquarePlus } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "installPromptDismissedAt"
const DISMISS_DAYS = 7

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    if (isStandalone) return

    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
      return
    }

    const ua = window.navigator.userAgent
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIos(iosDevice)
    if (iosDevice) setVisible(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredEvent) return
    await deferredEvent.prompt()
    const { outcome } = await deferredEvent.userChoice
    if (outcome === "accepted") setVisible(false)
    setDeferredEvent(null)
  }

  if (!visible) return null

  return (
    <div className="relative mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-fade-in">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {isIos ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">Instalá la app</p>
        {isIos ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tocá <Share className="inline h-3.5 w-3.5 -translate-y-0.5" /> Compartir y luego{" "}
            <SquarePlus className="inline h-3.5 w-3.5 -translate-y-0.5" /> "Agregar a pantalla de inicio".
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Agregala a tu pantalla de inicio para usarla como una app, sin el navegador.
            </p>
            <button
              onClick={handleInstall}
              className="mt-2 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active-press"
            >
              Instalar
            </button>
          </>
        )}
      </div>
      <button onClick={handleDismiss} className="shrink-0 p-1 text-muted-foreground active-press">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

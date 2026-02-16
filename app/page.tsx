"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ExpenseApp } from "@/components/expense-app"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Protege la ruta: si no hay usuario tras cargar, redirige al login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Pantalla de carga inicial mientras se verifica la sesión
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <img 
            src="/icon-512.png" 
            alt="Gastos Cash" 
            className="mx-auto h-24 w-auto mb-4 animate-pulse" 
          />
          <p className="text-muted-foreground">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  // Evita destellos de contenido si el usuario no está autenticado
  if (!user) {
    return null
  }

  return (
    <main className="mx-auto max-w-md">
      <ExpenseApp />
    </main>
  )
}
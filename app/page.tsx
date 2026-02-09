"use client"

import { useAuth } from "@/context/auth-context"
import { ExpenseApp } from "@/components/expense-app"
import { AuthScreen } from "@/components/auth-screen"

export default function Home() {
  const { user, loading } = useAuth()

  // Mostrar pantalla de carga mientras verifica la autenticación
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <img src="/logo.png" alt="Gastos Cash" className="mx-auto h-24 w-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar pantalla de login
  if (!user) {
    return <AuthScreen />
  }

  // Si hay usuario, mostrar la app
  return (
    <main className="mx-auto max-w-md">
      <ExpenseApp />
    </main>
  )
}
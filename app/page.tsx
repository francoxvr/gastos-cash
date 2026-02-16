"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ExpenseApp } from "@/components/expense-app"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/20 flex items-center justify-center mb-4">
             <img src="/icon-192.png" alt="Logo" className="h-12 w-12 opacity-80" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Iniciando sesión...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="mx-auto max-w-md">
      <ExpenseApp />
    </main>
  )
}
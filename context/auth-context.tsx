"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Obtener sesión inicial de forma segura
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (error) {
        console.error("Error inicializando auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // 2. Suscribirse a cambios de estado (Login, Logout, Token Refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Limpieza manual opcional para asegurar reset inmediato
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {!loading ? children : (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
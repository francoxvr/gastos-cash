"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/context/theme-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Sun, Moon } from "lucide-react"
import Link from "next/link"
import InstallPrompt from "@/components/InstallPrompt"

export default function RegisterPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { signUp } = useAuth()

  // Estados del formulario
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false })

  // Lógica de validación
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 6
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isConfirmPasswordValid = password === confirmPassword && confirmPassword.length > 0
  const isFormValid = isEmailValid && isPasswordValid && isConfirmPasswordValid

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true, confirmPassword: true })
    
    if (!isFormValid) return

    setError("")
    setLoading(true)

    try {
      await signUp(email, password)
      router.push("/")
    } catch (err: any) {
      setError(err.code === "auth/email-already-in-use"
        ? "Este email ya está en uso"
        : "Error al registrarse. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 animate-fade-in">
      
      {/* Selector de tema */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 h-10 w-10 flex items-center justify-center rounded-2xl bg-card transition-colors z-50 active-press"
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/icon-512.png" alt="Logo" className="mx-auto h-20 w-20 mb-4 rounded-3xl shadow-xl shadow-primary/25 animate-entrance" />
          <h1 className="text-3xl font-extrabold tracking-tight">Crear cuenta</h1>
          <p className="mt-2 text-muted-foreground">Comienza a controlar tus gastos</p>
        </div>

        <InstallPrompt />

        {/* Formulario de registro */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`h-12 rounded-2xl bg-card pr-10 ${touched.email ? (isEmailValid ? 'border-success' : 'border-destructive') : ''}`}
                required
              />
              {touched.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailValid ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                className="h-12 rounded-2xl bg-card pr-10"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Indicadores de requisitos de contraseña */}
            {touched.password && (
              <div className="grid grid-cols-2 gap-1 text-[10px] mt-2">
                <Requirement label="6+ caracteres" met={isPasswordValid} />
                <Requirement label="Una mayúscula" met={hasUpperCase} />
                <Requirement label="Una minúscula" met={hasLowerCase} />
                <Requirement label="Un número" met={hasNumber} />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`h-12 rounded-2xl bg-card ${touched.confirmPassword ? (isConfirmPasswordValid ? 'border-success' : 'border-destructive') : ''}`}
                required
              />
            </div>
          </div>

          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-2xl">{error}</div>}

          <Button type="submit" className="w-full h-12 rounded-2xl active-press" disabled={loading || !isFormValid}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link href="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link>
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground/70">
          Al registrarte aceptás los{" "}
          <Link href="/terms" className="underline hover:text-foreground">Términos de Servicio</Link> y la{" "}
          <Link href="/privacy" className="underline hover:text-foreground">Política de Privacidad</Link>.
        </p>
      </div>
    </div>
  )
}

// Sub-componente simple para los requisitos
function Requirement({ label, met }: { label: string, met: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-success' : 'text-muted-foreground'}`}>
      {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  )
}
"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

export type Theme = "light" | "dark" | "auto"

interface ThemeContextType {
  theme: Theme
  resolvedTheme: "light" | "dark"
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  const resolve = useCallback((t: Theme): "light" | "dark" => {
    if (t === "auto") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    return t
  }, [])

  useEffect(() => {
    setMounted(true)
    const stored = (window.localStorage.getItem("theme-app") as Theme | null) || "auto"
    const resolved = resolve(stored)
    setTheme(stored)
    setResolvedTheme(resolved)
    applyTheme(resolved)

    if (stored === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        const r = e.matches ? "dark" : "light"
        setResolvedTheme(r)
        applyTheme(r)
      }
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [resolve])

  const toggleTheme = () => {
    const cycle: Theme[] = ["light", "dark", "auto"]
    const next = cycle[(cycle.indexOf(theme) + 1) % 3]
    const resolved = resolve(next)
    setTheme(next)
    setResolvedTheme(resolved)
    applyTheme(resolved)
    window.localStorage.setItem("theme-app", next)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider")
  }
  return context
}

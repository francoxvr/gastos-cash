"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Inicializamos con un valor seguro para el servidor
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = window.localStorage.getItem("theme-app") as Theme | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const initialTheme = stored || (prefersDark ? "dark" : "light")
    
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    
    // Aplicamos el cambio al HTML para que Tailwind lo detecte
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    
    window.localStorage.setItem("theme-app", next)
  }

  // Evitamos renderizar contenido que dependa del tema hasta que el cliente esté listo
  // Esto previene errores de "Hydration Mismatch"
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ExpenseList } from "@/components/expense-list"
import { AddExpenseForm } from "@/components/add-expense-form"
import { StatsScreen } from "@/components/stats-screen"
import { ExpenseCalendar } from "@/components/expense-calendar"
import { CategoryManager } from "@/components/category-manager"
import { useExpenses } from "@/context/expense-context"
import { useTheme } from "@/context/theme-context"
import { useAuth } from "@/context/auth-context"
import { formatCurrency, exportToCSV, type Expense } from "@/lib/expenses"
import { 
  Plus, BarChart3, CalendarHeart, Tag, Sun, Moon, ArrowLeft, 
  CalendarDays, CalendarClock, CalendarRange, Calendar, Trash2, Download, LogOut 
} from "lucide-react"

type Screen = "home" | "add" | "edit" | "stats" | "calendar" | "categories"
type TimeFilter = "dia" | "semana" | "mes" | "anio"

export function ExpenseApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("mes") // Por defecto Mes suele ser más útil
  
  const { expenses, clearAllExpenses, currentMonth, currentYear } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleClearAll = async () => {
    if (confirm("⚠️ ¿Vaciar toda tu cuenta?\n\nEsta acción borrará todos tus gastos de forma permanente.")) {
      await clearAllExpenses()
    }
  }

  const handleSignOut = async () => {
    if (confirm("¿Cerrar sesión?")) await signOut()
  }

  // Filtrado de gastos con lógica de fechas robusta
  const filteredTotal = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    return expenses
      .filter((expense) => {
        const [year, month, day] = expense.date.split('-').map(Number)
        const expenseDateObj = new Date(year, month - 1, day)
        
        if (timeFilter === "dia") return expense.date === todayStr
        
        if (timeFilter === "semana") {
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          return expenseDateObj >= startOfWeek && expenseDateObj <= now
        }
        
        if (timeFilter === "mes") {
          return (month - 1) === currentMonth && year === currentYear
        }
        
        return year === currentYear
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses, timeFilter, currentMonth, currentYear])

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const filterLabel = { 
    dia: "Hoy", 
    semana: "esta semana", 
    mes: monthNames[currentMonth], 
    anio: `${currentYear}` 
  }

  if (!mounted) return null

  // Renderizado condicional de pantallas (Sub-rutas)
  if (currentScreen === "add") return <AddExpenseForm onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "edit") return <AddExpenseForm onClose={() => setCurrentScreen("home")} editingExpense={editingExpense} />
  if (currentScreen === "stats") return <StatsScreen onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "categories") return <CategoryManager onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "calendar") return (
    <div className="flex min-h-screen flex-col bg-background animate-fade-in">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md border-b border-border/40">
        <button onClick={() => setCurrentScreen("home")} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted active-press"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="text-xl font-semibold">Calendario</h1>
      </header>
      <div className="flex-1 px-4 py-4"><ExpenseCalendar /></div>
    </div>
  )

  // Pantalla Principal (Home)
  return (
    <div className="flex min-h-screen flex-col bg-background animate-fade-in">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-4 py-4 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="Logo" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-lg tracking-tight">Gastos Cash</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => exportToCSV(expenses)} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors active-press" title="Descargar CSV"><Download className="h-5 w-5" /></button>
          <button onClick={handleClearAll} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors active-press" title="Vaciar datos"><Trash2 className="h-5 w-5" /></button>
          <div className="w-[1px] h-6 bg-border mx-1" /> {/* Separador */}
          <button onClick={toggleTheme} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted active-press">
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={handleSignOut} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground active-press"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-40">
        {/* Selector de Filtro de Tiempo */}
        <div className="flex gap-1.5 rounded-2xl bg-muted/50 p-1.5 border border-border/50">
          {[
            { key: "dia", label: "Día", icon: CalendarDays },
            { key: "semana", label: "Semana", icon: CalendarClock },
            { key: "mes", label: "Mes", icon: CalendarRange },
            { key: "anio", label: "Año", icon: Calendar }
          ].map((tab) => (
            <button 
              key={tab.key} 
              onClick={() => setTimeFilter(tab.key as TimeFilter)} 
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all active-press ${
                timeFilter === tab.key ? "bg-background text-primary shadow-sm border border-border/10" : "text-muted-foreground opacity-70"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tarjeta de Saldo */}
        <div className="rounded-[2.5rem] bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          <p className="text-sm font-medium opacity-80 mb-1">Total de {filterLabel[timeFilter]}</p>
          <h2 className="text-5xl font-bold tracking-tighter">{formatCurrency(filteredTotal)}</h2>
        </div>

        {/* Menú Rápido de Accesos */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setCurrentScreen("stats")} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-card border border-border/40 hover:bg-muted/50 transition-colors active-press">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl"><BarChart3 className="h-6 w-6" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estadísticas</span>
          </button>
          <button onClick={() => setCurrentScreen("calendar")} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-card border border-border/40 hover:bg-muted/50 transition-colors active-press">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl"><CalendarHeart className="h-6 w-6" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Calendario</span>
          </button>
          <button onClick={() => setCurrentScreen("categories")} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-card border border-border/40 hover:bg-muted/50 transition-colors active-press">
            <div className="p-3 bg-orange-500/10 text-orange-600 rounded-2xl"><Tag className="h-6 w-6" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categorías</span>
          </button>
        </div>

        {/* Lista de Gastos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Gastos recientes</h2>
          </div>
          <ExpenseList onEdit={(e) => { setEditingExpense(e); setCurrentScreen("edit"); }} />
        </div>
      </main>

      {/* Botón de Acción Flotante */}
      <div className="fixed bottom-8 left-0 right-0 z-[50] px-6 flex justify-center pointer-events-none">
        <Button 
          onClick={() => setCurrentScreen("add")} 
          size="lg" 
          className="h-16 w-full max-w-md text-lg font-bold shadow-2xl active-press rounded-2xl bg-primary text-primary-foreground pointer-events-auto"
        >
          <Plus className="mr-2 h-7 w-7 stroke-[3px]" /> Agregar gasto
        </Button>
      </div>
    </div>
  )
}
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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("dia")
  
  const { expenses, clearAllExpenses, currentMonth, currentYear } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleClearAll = async () => {
    const mensajeAmigable = "⚠️ ¿Vaciar toda tu cuenta?\n\nEsta acción borrará todos tus gastos de forma permanente y no se podrá deshacer. ¿Estás seguro de que quieres empezar de cero?";
    if (confirm(mensajeAmigable)) {
      await clearAllExpenses()
    }
  }

  const handleSignOut = async () => {
    if (confirm("¿Cerrar sesión?")) {
      await signOut()
    }
  }

  const filteredTotal = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return expenses
      .filter((expense) => {
        const [year, month, day] = expense.date.split('-').map(Number)
        const expenseDate = new Date(year, month - 1, day).getTime()
        if (timeFilter === "dia") return expenseDate === today
        if (timeFilter === "semana") {
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime()
          return expenseDate >= weekStart && expenseDate <= now.getTime()
        }
        if (timeFilter === "mes") {
          const d = new Date(year, month - 1, day)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        }
        return year === currentYear
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses, timeFilter, currentMonth, currentYear])

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const filterLabel = { dia: "Hoy", semana: "esta semana", mes: monthNames[currentMonth], anio: `${currentYear}` }

  if (!mounted) return null

  if (currentScreen === "add") return <AddExpenseForm onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "edit") return <AddExpenseForm onClose={() => setCurrentScreen("home")} editingExpense={editingExpense} />
  if (currentScreen === "stats") return <StatsScreen onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "categories") return <CategoryManager onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "calendar") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
          <button onClick={() => setCurrentScreen("home")} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted"><ArrowLeft className="h-6 w-6" /></button>
          <h1 className="text-xl font-semibold">Calendario</h1>
        </header>
        <div className="flex-1 px-4 pb-8"><ExpenseCalendar /></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-4 py-4 backdrop-blur-md">
        <div></div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => exportToCSV(expenses)} 
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
            title="Descargar gastos (CSV)"
          >
            <Download className="h-5 w-5" />
          </button>

          <button 
            onClick={handleClearAll} 
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors"
            title="Vaciar datos"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          
          <button onClick={toggleTheme} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted">
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => setCurrentScreen("categories")} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted"><Tag className="h-5 w-5" /></button>
          <button onClick={() => setCurrentScreen("calendar")} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted"><CalendarHeart className="h-5 w-5" /></button>
          <button onClick={() => setCurrentScreen("stats")} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted"><BarChart3 className="h-5 w-5" /></button>
          
          <button 
            onClick={handleSignOut} 
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 pb-44">
        <div className="flex gap-2 rounded-xl bg-card p-1.5 shadow-sm border border-border/10">
          {[{ key: "dia", label: "Día", icon: CalendarDays }, { key: "semana", label: "Semana", icon: CalendarClock }, { key: "mes", label: "Mes", icon: CalendarRange }, { key: "anio", label: "Año", icon: Calendar }].map((tab) => (
            <button key={tab.key} onClick={() => setTimeFilter(tab.key as TimeFilter)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${timeFilter === tab.key ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div key={timeFilter} className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
          <p className="text-sm opacity-90 font-medium">Total de {filterLabel[timeFilter]}</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(filteredTotal)}</p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Gastos recientes</h2>
          <ExpenseList onEdit={(e) => { setEditingExpense(e); setCurrentScreen("edit"); }} />
        </div>
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-[100] px-6 flex justify-center">
        <Button onClick={() => setCurrentScreen("add")} size="lg" className="h-16 w-full max-w-md text-lg font-bold shadow-lg active:scale-95 transition-all rounded-2xl bg-primary text-primary-foreground">
          <Plus className="mr-2 h-7 w-7 stroke-[3px]" /> Agregar gasto
        </Button>
      </div>
    </div>
  )
}
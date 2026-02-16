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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("mes") 
  
  const { expenses, clearAllExpenses, currentMonth, currentYear } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleClearAll = async () => {
    if (confirm("⚠️ ¿Vaciar todos tus datos? Esta acción es permanente.")) {
      await clearAllExpenses()
    }
  }

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
          return expenseDateObj >= startOfWeek && expenseDateObj <= now
        }
        if (timeFilter === "mes") return (month - 1) === currentMonth && year === currentYear
        return year === currentYear
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses, timeFilter, currentMonth, currentYear])

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const filterLabel = { dia: "Hoy", semana: "esta semana", mes: monthNames[currentMonth], anio: `${currentYear}` }

  if (!mounted) return null

  // Navegación de Pantallas
  if (currentScreen === "add") return <AddExpenseForm onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "edit") return <AddExpenseForm onClose={() => setCurrentScreen("home")} editingExpense={editingExpense} />
  if (currentScreen === "stats") return <StatsScreen onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "categories") return <CategoryManager onClose={() => setCurrentScreen("home")} />
  if (currentScreen === "calendar") return (
    <div className="flex min-h-screen flex-col bg-background animate-in slide-in-from-right duration-300">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md border-b border-white/5">
        <button onClick={() => setCurrentScreen("home")} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-muted/50 active-press"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-black uppercase tracking-widest">Calendario</h1>
      </header>
      <div className="flex-1 px-4 py-4"><ExpenseCalendar /></div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background animate-fade-in pb-32">
      {/* Header Estilizado */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-4 py-6 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <img src="/icon-192.png" alt="Logo" className="h-6 w-6 brightness-0 invert" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter uppercase leading-none">Gastos Cash</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Premium Access</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-muted/50 active-press">
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => exportToCSV(expenses)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground active-press"><Download className="h-5 w-5" /></button>
          <button onClick={async () => { if (confirm("¿Cerrar sesión?")) await signOut() }} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 active-press"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-6">
        {/* Selector de Tiempo con Neumorfismo sutil */}
        <div className="flex gap-1 rounded-[1.5rem] bg-muted/30 p-1 border border-white/5">
          {[{ key: "dia", label: "Día", icon: CalendarDays }, { key: "semana", label: "Sem.", icon: CalendarClock }, { key: "mes", label: "Mes", icon: CalendarRange }, { key: "anio", label: "Año", icon: Calendar }].map((tab) => (
            <button key={tab.key} onClick={() => setTimeFilter(tab.key as TimeFilter)} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-tight transition-all active-press ${timeFilter === tab.key ? "bg-background text-primary shadow-sm border border-white/10" : "text-muted-foreground opacity-60"}`}>
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Hero Card: Saldo Total */}
        <div className="rounded-[2.5rem] bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Gasto total de {filterLabel[timeFilter]}</p>
          <h2 className="text-5xl font-black tracking-tighter tabular-nums">{formatCurrency(filteredTotal)}</h2>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "stats", label: "Estadísticas", icon: BarChart3, color: "blue" },
            { id: "calendar", label: "Calendario", icon: CalendarHeart, color: "purple" },
            { id: "categories", label: "Categorías", icon: Tag, color: "orange" }
          ].map((item) => (
            <button key={item.id} onClick={() => setCurrentScreen(item.id as Screen)} className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-card border border-white/5 hover:border-primary/20 transition-all active-press shadow-sm">
              <div className={`p-3 bg-${item.color}-500/10 text-${item.color}-500 rounded-2xl`}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Listado Principal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black uppercase tracking-tighter">Actividad reciente</h2>
            <button onClick={handleClearAll} className="text-[10px] font-bold text-red-500 uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Borrar todo</button>
          </div>
          <ExpenseList onEdit={(e) => { setEditingExpense(e); setCurrentScreen("edit"); }} />
        </div>
      </main>

      {/* FAB: Botón Flotante */}
      <div className="fixed bottom-8 left-0 right-0 z-40 px-6 flex justify-center pointer-events-none">
        <Button 
          onClick={() => setCurrentScreen("add")} 
          className="h-16 w-full max-w-md text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/40 active-press rounded-[1.5rem] bg-primary text-primary-foreground pointer-events-auto"
        >
          <Plus className="mr-2 h-6 w-6 stroke-[4px]" /> Agregar nuevo gasto
        </Button>
      </div>
    </div>
  )
}
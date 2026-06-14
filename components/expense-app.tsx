"use client"

import { useState, useMemo, useEffect } from "react"
import { AddExpenseForm } from "@/components/add-expense-form"
import { ExpenseList } from "@/components/expense-list"
import { StatsScreen } from "@/components/stats-screen"
import { ExpenseCalendar } from "@/components/expense-calendar"
import { CategoryManager } from "@/components/category-manager"
import { useExpenses } from "@/context/expense-context"
import { useTheme } from "@/context/theme-context"
import { useAuth } from "@/context/auth-context"
import { formatCurrency, exportToCSV, type Expense } from "@/lib/expenses"
import {
  Plus, BarChart3, CalendarDays, MoreHorizontal, Home,
  Sun, Moon, Download, Trash2, LogOut, ChevronRight, Tag, Wallet, Sparkles,
} from "lucide-react"

type Tab = "home" | "stats" | "calendar" | "more"
type Overlay = "add" | "edit" | "categories" | null

export function ExpenseApp() {
  const [tab, setTab] = useState<Tab>("home")
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [timeFilter, setTimeFilter] = useState<"dia" | "semana" | "mes" | "anio">("mes")
  const [mounted, setMounted] = useState(false)

  const { expenses, clearAllExpenses, categories, getCategoryById, currentMonth, currentYear } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])

  const periodExpenses = useMemo(() => {
    const now = new Date()
    return expenses.filter((e) => {
      const [year, month, day] = e.date.split("-").map(Number)
      const d = new Date(year, month - 1, day)
      if (timeFilter === "dia") return e.date === todayStr
      if (timeFilter === "semana") {
        const start = new Date(now)
        start.setDate(now.getDate() - now.getDay())
        return d >= start && d <= now
      }
      if (timeFilter === "mes") return (month - 1) === currentMonth && year === currentYear
      return year === currentYear
    })
  }, [expenses, timeFilter, currentMonth, currentYear, todayStr])

  const filteredTotal = useMemo(
    () => periodExpenses.reduce((sum, e) => sum + e.amount, 0),
    [periodExpenses]
  )

  const todayTotal = useMemo(
    () => expenses.filter((e) => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0),
    [expenses, todayStr]
  )

  const topCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of periodExpenses) {
      totals.set(e.category, (totals.get(e.category) || 0) + e.amount)
    }
    let best: { id: string; amount: number } | null = null
    for (const [id, amount] of totals) {
      if (!best || amount > best.amount) best = { id, amount }
    }
    return best ? { ...best, cat: getCategoryById(best.id) } : null
  }, [periodExpenses, getCategoryById])

  const MONTH_NAMES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ]

  const periodLabel = {
    dia: "Hoy",
    semana: "Esta semana",
    mes: MONTH_NAMES[currentMonth],
    anio: `Año ${currentYear}`,
  }

  if (!mounted) return null

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setOverlay("edit")
  }

  const closeOverlay = () => {
    setOverlay(null)
    setEditingExpense(null)
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">

      {/* ── Overlays ── */}
      {(overlay === "add" || overlay === "edit") && (
        <div className="fixed inset-0 z-50">
          <AddExpenseForm
            onClose={closeOverlay}
            editingExpense={overlay === "edit" ? editingExpense : null}
          />
        </div>
      )}
      {overlay === "categories" && (
        <div className="fixed inset-0 z-50">
          <CategoryManager onClose={closeOverlay} />
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/25">
            <Wallet className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-base tracking-tight">Gastos Cash</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="h-10 w-10 flex items-center justify-center rounded-2xl surface-card text-muted-foreground active-press transition-colors"
          >
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>
          <button
            onClick={async () => { if (confirm("¿Cerrar sesión?")) await signOut() }}
            className="h-10 w-10 flex items-center justify-center rounded-2xl surface-card text-muted-foreground active-press transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* ── Tab Content ── */}
      <main className="flex-1 overflow-y-auto overscroll-none">

        {/* HOME */}
        {tab === "home" && (
          <div className="flex flex-col gap-4 pb-6 animate-fade-in">

            {/* Hero: degradado con filtro de tiempo + balance */}
            <div className="relative mx-4 overflow-hidden rounded-[2rem] gradient-mesh px-6 pt-5 pb-12 text-primary-foreground shadow-xl shadow-primary/25">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-14 -bottom-14 h-44 w-44 rounded-full bg-black/10 blur-3xl pointer-events-none" />

              {/* Time filter pills */}
              <div className="relative z-10 flex gap-1 rounded-2xl bg-white/15 backdrop-blur-md p-1">
                {(["dia","semana","mes","anio"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active-press ${
                      timeFilter === f
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-primary-foreground/70"
                    }`}
                  >
                    {periodLabel[f]}
                  </button>
                ))}
              </div>

              <div className="relative z-10 mt-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/60">
                  Total gastado · {periodLabel[timeFilter]}
                </p>
                <h2 className="mt-1 text-[2.75rem] font-black tracking-tight leading-none tabular-nums">
                  {formatCurrency(filteredTotal)}
                </h2>
              </div>
            </div>

            {/* Chips flotantes superpuestos */}
            <div className="relative z-10 -mt-7 grid grid-cols-2 gap-3 px-4">
              <div className="surface-card rounded-2xl p-4 shadow-lg flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Hoy</span>
                </div>
                <span className="text-xl font-black tabular-nums tracking-tight">{formatCurrency(todayTotal)}</span>
              </div>
              <div className="surface-card rounded-2xl p-4 shadow-lg flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Top categoría</span>
                </div>
                {topCategory?.cat ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{topCategory.cat.emoji}</span>
                    <span className="text-sm font-extrabold truncate">{topCategory.cat.label}</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground/50">Sin datos</span>
                )}
              </div>
            </div>

            {/* Expense list */}
            <div className="px-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 mt-1">
                Movimientos
              </p>
              <ExpenseList onEdit={openEdit} />
            </div>
          </div>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div className="animate-fade-in">
            <StatsScreen onClose={() => setTab("home")} />
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div className="px-4 pt-2 pb-6 animate-fade-in">
            <p className="text-xl font-extrabold mb-4">Calendario</p>
            <ExpenseCalendar />
          </div>
        )}

        {/* MORE */}
        {tab === "more" && (
          <div className="flex flex-col px-4 pt-2 pb-6 gap-3 animate-fade-in">
            <p className="text-xl font-extrabold mb-1">Ajustes</p>

            {/* Main options */}
            <div className="rounded-2xl overflow-hidden surface-card divide-y divide-border/50">

              <button
                onClick={() => setOverlay("categories")}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <Tag className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Categorías</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => exportToCSV(expenses)}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <Download className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Exportar CSV</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    {theme === "light"
                      ? <Moon className="h-4 w-4 text-accent-foreground" />
                      : <Sun className="h-4 w-4 text-accent-foreground" />}
                  </div>
                  <span className="font-semibold text-sm">
                    {theme === "light" ? "Modo oscuro" : "Modo claro"}
                  </span>
                </div>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>

            {/* Sign out */}
            <div className="rounded-2xl overflow-hidden surface-card">
              <button
                onClick={async () => { if (confirm("¿Cerrar sesión?")) await signOut() }}
                className="flex items-center gap-3 w-full px-4 py-3.5 active-press hover:bg-destructive/5 transition-colors"
              >
                <div className="h-9 w-9 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-destructive" />
                </div>
                <span className="font-semibold text-sm text-destructive">Cerrar sesión</span>
              </button>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl overflow-hidden surface-card">
              <button
                onClick={async () => {
                  if (confirm("⚠️ ¿Eliminar TODOS los gastos? Esta acción no se puede deshacer.")) {
                    await clearAllExpenses()
                  }
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 active-press hover:bg-destructive/5 transition-colors"
              >
                <div className="h-9 w-9 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <span className="font-semibold text-sm text-destructive">Vaciar todos los gastos</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="relative mx-3 mb-3 flex items-center justify-around gap-1 rounded-[1.75rem] surface-card backdrop-blur-xl px-2 py-2 shadow-lg shrink-0">
        {(["home","stats"] as const).map((key) => {
          const Icon = key === "home" ? Home : BarChart3
          const label = key === "home" ? "Inicio" : "Stats"
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 rounded-2xl transition-all active-press ${
                tab === key ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={tab === key ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          )
        })}

        {/* Center add button */}
        <button
          onClick={() => setOverlay("add")}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand shadow-lg shadow-primary/35 active-press"
        >
          <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </button>

        {(["calendar","more"] as const).map((key) => {
          const Icon = key === "calendar" ? CalendarDays : MoreHorizontal
          const label = key === "calendar" ? "Calendario" : "Más"
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 rounded-2xl transition-all active-press ${
                tab === key ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={tab === key ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

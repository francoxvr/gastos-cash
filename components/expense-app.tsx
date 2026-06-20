"use client"

import { useState, useMemo, useEffect } from "react"
import { AddExpenseForm } from "@/components/add-expense-form"
import { ExpenseList } from "@/components/expense-list"
import { StatsScreen } from "@/components/stats-screen"
import { ExpenseCalendar } from "@/components/expense-calendar"
import { CategoryManager } from "@/components/category-manager"
import { RecurringManager } from "@/components/recurring-manager"
import { CurrencyManager } from "@/components/currency-manager"
import { SharedAccountManager } from "@/components/shared-account-manager"
import { GoalsManager } from "@/components/goals-manager"
import { useExpenses } from "@/context/expense-context"
import { useTheme } from "@/context/theme-context"
import { useAuth } from "@/context/auth-context"
import { formatCurrency, exportToCSV, exportMonthlyReportPDF, toBaseAmount, type Expense } from "@/lib/expenses"
import {
  Plus, BarChart3, CalendarDays, MoreHorizontal, Home,
  Sun, Moon, Download, Trash2, LogOut, ChevronRight, Tag, Wallet, Sparkles, Search, AlertTriangle, Repeat, X, Coins, Users, PiggyBank, Bell, BellOff, FileText, Target,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Tab = "home" | "stats" | "calendar" | "more"
type Overlay = "add" | "edit" | "categories" | "recurring" | "currencies" | "shared" | "goals" | null

export function ExpenseApp() {
  const [tab, setTab] = useState<Tab>("home")
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [timeFilter, setTimeFilter] = useState<"dia" | "semana" | "mes" | "anio">("mes")
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)

  const { expenses, clearAllExpenses, categories, getCategoryById, currentMonth, currentYear, recurringExpenses, confirmRecurring, skipRecurring, getBaseCurrency, monthlyBudget, setMonthlyBudget } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [confirmAction, setConfirmAction] = useState<"signOut" | "clearAll" | null>(null)
  const [budgetEditing, setBudgetEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState("")

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
    () => periodExpenses.filter((e) => e.type !== "income").reduce((sum, e) => sum + toBaseAmount(e), 0),
    [periodExpenses]
  )

  const periodIncomeTotal = useMemo(
    () => periodExpenses.filter((e) => e.type === "income").reduce((sum, e) => sum + toBaseAmount(e), 0),
    [periodExpenses]
  )

  const balance = periodIncomeTotal - filteredTotal

  const todayTotal = useMemo(
    () => expenses.filter((e) => e.date === todayStr && e.type !== "income").reduce((sum, e) => sum + toBaseAmount(e), 0),
    [expenses, todayStr]
  )

  const monthTotal = useMemo(
    () => expenses.filter((e) => {
      const [y, m] = e.date.split("-").map(Number)
      return (m - 1) === currentMonth && y === currentYear && e.type !== "income"
    }).reduce((sum, e) => sum + toBaseAmount(e), 0),
    [expenses, currentMonth, currentYear]
  )

  const topCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of periodExpenses) {
      if (e.type === "income") continue
      totals.set(e.category, (totals.get(e.category) || 0) + toBaseAmount(e))
    }
    let best: { id: string; amount: number } | null = null
    for (const [id, amount] of totals) {
      if (!best || amount > best.amount) best = { id, amount }
    }
    return best ? { ...best, cat: getCategoryById(best.id) } : null
  }, [periodExpenses, getCategoryById])

  const overBudgetCategories = useMemo(() => {
    const spent = new Map<string, number>()
    for (const e of expenses) {
      const [year, month] = e.date.split("-").map(Number)
      if ((month - 1) === currentMonth && year === currentYear) {
        spent.set(e.category, (spent.get(e.category) || 0) + toBaseAmount(e))
      }
    }
    return categories
      .filter((cat) => cat.budget && (spent.get(cat.id) || 0) > cat.budget)
      .map((cat) => ({ cat, spent: spent.get(cat.id) || 0 }))
  }, [expenses, categories, currentMonth, currentYear])

  const pendingRecurring = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return recurringExpenses.filter((r) => r.dayOfMonth <= now.getDate() && r.lastGeneratedMonth !== monthKey)
  }, [recurringExpenses])

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    setNotificationPermission(Notification.permission)
    setNotificationsEnabled(localStorage.getItem("notificationsEnabled") === "true" && Notification.permission === "granted")
  }, [])

  const toggleNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === "granted") {
        localStorage.setItem("notificationsEnabled", "true")
        setNotificationsEnabled(true)
      }
    } else {
      localStorage.setItem("notificationsEnabled", "false")
      setNotificationsEnabled(false)
    }
  }

  // Avisa una vez por día sobre recurrentes pendientes y presupuestos superados
  useEffect(() => {
    if (!notificationsEnabled || !mounted) return
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    const today = new Date().toISOString().split("T")[0]
    if (localStorage.getItem("lastNotificationCheck") === today) return
    localStorage.setItem("lastNotificationCheck", today)

    pendingRecurring.forEach((rec) => {
      const cat = getCategoryById(rec.category)
      new Notification("Gasto recurrente pendiente", {
        body: `${cat?.emoji || "💸"} ${rec.description}: ${formatCurrency(rec.amount)}`,
        icon: "/icon-192.png",
        tag: `recurring-${rec.id}-${today}`,
      })
    })

    overBudgetCategories.forEach(({ cat, spent }) => {
      new Notification("Presupuesto superado", {
        body: `${cat.emoji} ${cat.label}: ${formatCurrency(spent)} / ${formatCurrency(cat.budget!)}`,
        icon: "/icon-192.png",
        tag: `budget-${cat.id}-${today}`,
      })
    })
  }, [notificationsEnabled, mounted, pendingRecurring, overBudgetCategories, getCategoryById])

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
      {overlay === "recurring" && (
        <div className="fixed inset-0 z-50">
          <RecurringManager onClose={closeOverlay} />
        </div>
      )}
      {overlay === "currencies" && (
        <div className="fixed inset-0 z-50">
          <CurrencyManager onClose={closeOverlay} />
        </div>
      )}
      {overlay === "shared" && (
        <div className="fixed inset-0 z-50">
          <SharedAccountManager onClose={closeOverlay} />
        </div>
      )}
      {overlay === "goals" && (
        <div className="fixed inset-0 z-50">
          <GoalsManager onClose={closeOverlay} />
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
            onClick={() => setConfirmAction("signOut")}
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
                <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-primary-foreground/80">
                    Ingresos +{formatCurrency(periodIncomeTotal)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 ${balance >= 0 ? "bg-success/30 text-white" : "bg-destructive/40 text-white"}`}>
                    Balance {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chips flotantes superpuestos */}
            <div className="relative z-10 -mt-3 grid grid-cols-2 gap-3 px-4">
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

            {/* Barra de presupuesto mensual */}
            {monthlyBudget && monthlyBudget > 0 && (
              <div className="mx-4 surface-card rounded-3xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Presupuesto mensual</span>
                  </div>
                  <span className={`text-xs font-bold ${monthTotal > monthlyBudget ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatCurrency(monthTotal)} / {formatCurrency(monthlyBudget)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      monthTotal > monthlyBudget
                        ? "bg-destructive"
                        : monthTotal / monthlyBudget > 0.8
                        ? "bg-yellow-500"
                        : "bg-success"
                    }`}
                    style={{ width: `${Math.min((monthTotal / monthlyBudget) * 100, 100)}%` }}
                  />
                </div>
                {monthTotal > monthlyBudget && (
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Superaste el presupuesto por {formatCurrency(monthTotal - monthlyBudget)}
                  </p>
                )}
              </div>
            )}

            {/* Gastos recurrentes pendientes */}
            {pendingRecurring.length > 0 && (
              <div className="mx-4 flex flex-col gap-2">
                {pendingRecurring.map((rec) => {
                  const cat = getCategoryById(rec.category)
                  return (
                    <div key={rec.id} className="flex items-center gap-3 rounded-2xl surface-card p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent">
                        <Repeat className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="text-sm font-bold truncate">
                          {rec.description || cat?.label || "Gasto recurrente"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(rec.amount)} · {cat?.emoji} {cat?.label}
                        </span>
                      </div>
                      <button
                        onClick={() => skipRecurring(rec.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted active-press"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => confirmRecurring(rec.id)}
                        className="shrink-0 rounded-xl gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground active-press"
                      >
                        Registrar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Aviso de presupuesto superado */}
            {overBudgetCategories.length > 0 && (
              <div className="mx-4 flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                {overBudgetCategories.map(({ cat, spent }) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-xs font-semibold text-destructive">
                      Superaste el presupuesto de <span className="font-extrabold">{cat.emoji} {cat.label}</span>: {formatCurrency(spent)} / {formatCurrency(cat.budget!)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Expense list */}
            <div className="px-4">
              <div className="flex items-center justify-between mb-3 mt-1 gap-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                  Movimientos
                </p>
                <div className="relative flex-1 max-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full rounded-full surface-card pl-8 pr-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <ExpenseList onEdit={openEdit} searchQuery={searchQuery} />
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
            <ExpenseCalendar onEdit={openEdit} />
          </div>
        )}

        {/* MORE */}
        {tab === "more" && (
          <div className="flex flex-col px-4 pt-2 pb-6 gap-3 animate-fade-in">
            <p className="text-xl font-extrabold mb-1">Ajustes</p>

            {/* User info */}
            <div className="flex items-center gap-3 rounded-2xl surface-card p-4">
              <div className="h-11 w-11 shrink-0 rounded-2xl gradient-brand flex items-center justify-center text-lg font-black text-primary-foreground">
                {(user?.email?.[0] || "?").toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">{user?.email}</span>
                <span className="text-xs text-muted-foreground">Cuenta activa</span>
              </div>
            </div>

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
                onClick={() => setOverlay("recurring")}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <Repeat className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Gastos recurrentes</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setOverlay("goals")}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <PiggyBank className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Metas de ahorro</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex flex-col">
                <button
                  onClick={() => {
                    if (!budgetEditing) {
                      setBudgetInput(monthlyBudget ? monthlyBudget.toString() : "")
                      setBudgetEditing(true)
                    }
                  }}
                  className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                      <Target className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <span className="font-semibold text-sm">Presupuesto mensual</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {monthlyBudget ? formatCurrency(monthlyBudget) : "Sin límite"}
                  </span>
                </button>
                {budgetEditing && (
                  <div className="flex items-center gap-2 px-4 pb-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      placeholder="0"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ""))}
                      className="h-10 flex-1 rounded-2xl bg-muted px-3 text-sm font-bold outline-none ring-primary/20 focus:ring-2"
                    />
                    <button
                      onClick={async () => {
                        const val = parseFloat(budgetInput)
                        await setMonthlyBudget(val > 0 ? val : null)
                        setBudgetEditing(false)
                      }}
                      className="h-10 rounded-2xl gradient-brand px-4 text-xs font-bold text-primary-foreground active-press"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setBudgetEditing(false)}
                      className="h-10 rounded-2xl bg-muted px-3 text-xs font-bold text-muted-foreground active-press"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setOverlay("currencies")}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <Coins className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Monedas</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setOverlay("shared")}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <Users className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Cuenta compartida</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={toggleNotifications}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    {notificationsEnabled ? <Bell className="h-4 w-4 text-accent-foreground" /> : <BellOff className="h-4 w-4 text-accent-foreground" />}
                  </div>
                  <span className="font-semibold text-sm">Notificaciones</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {notificationsEnabled ? "Activadas" : notificationPermission === "denied" ? "Bloqueadas" : "Desactivadas"}
                </span>
              </button>

              <button
                onClick={() => exportToCSV(expenses, getBaseCurrency().code)}
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
                onClick={() => exportMonthlyReportPDF(expenses, categories, currentMonth, currentYear, getBaseCurrency().symbol)}
                className="flex items-center justify-between w-full px-4 py-3.5 active-press hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-accent flex items-center justify-center">
                    <FileText className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold text-sm">Exportar reporte PDF</span>
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
                onClick={() => setConfirmAction("signOut")}
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
                onClick={() => setConfirmAction("clearAll")}
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

      {/* ── Diálogo de confirmación ── */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "signOut" ? "¿Cerrar sesión?" : "¿Eliminar todos los gastos?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "signOut"
                ? "Vas a tener que volver a iniciar sesión para acceder a tu cuenta."
                : "Esta acción no se puede deshacer. Se eliminarán todos tus gastos registrados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (confirmAction === "signOut") await signOut()
                else if (confirmAction === "clearAll") await clearAllExpenses()
                setConfirmAction(null)
              }}
            >
              {confirmAction === "signOut" ? "Cerrar sesión" : "Eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

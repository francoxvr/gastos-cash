"use client"

import { useMemo, useState } from "react"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency } from "@/lib/expenses"
import {
  ArrowLeft,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type TimePeriod = "dia" | "semana" | "mes" | "anio"

interface StatsScreenProps {
  onClose: () => void
}

export function StatsScreen({ onClose }: StatsScreenProps) {
  const { expenses, categories, currentMonth, currentYear } = useExpenses()
  const [period, setPeriod] = useState<TimePeriod>("dia")

  const stats = useMemo(() => {
    const now = new Date()
    const todayTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime()

    const filtered = expenses.filter((expense) => {
      const [year, month, day] = expense.date.split('-').map(Number)
      const expenseTime = new Date(year, month - 1, day).getTime()

      if (period === "dia") return expenseTime === todayTarget
      if (period === "semana") return expenseTime >= weekStart && expenseTime <= now.getTime()
      if (period === "mes") return (month - 1) === currentMonth && year === currentYear
      return year === currentYear
    })

    const total = filtered.reduce((sum, e) => sum + e.amount, 0)

    const byCategory = categories.map((cat) => {
      const categoryTotal = filtered
        .filter((e) => e.category === cat.id)
        .reduce((sum, e) => sum + e.amount, 0)
      return {
        category: cat.id,
        label: cat.label,
        emoji: cat.emoji,
        amount: categoryTotal,
        fill: cat.color,
        percentage: total > 0 ? Math.round((categoryTotal / total) * 100) : 0,
      }
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

    const prevFiltered = expenses.filter((expense) => {
      const [year, month, day] = expense.date.split('-').map(Number)
      const expenseTime = new Date(year, month - 1, day).getTime()

      if (period === "dia") {
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
        return expenseTime === yesterday
      }
      if (period === "semana") {
        const prevWeekStart = weekStart - (7 * 24 * 60 * 60 * 1000)
        return expenseTime >= prevWeekStart && expenseTime < weekStart
      }
      if (period === "mes") {
        const prevM = currentMonth === 0 ? 11 : currentMonth - 1
        const prevY = currentMonth === 0 ? currentYear - 1 : currentYear
        return (month - 1) === prevM && year === prevY
      }
      return year === currentYear - 1
    })

    const prevTotal = prevFiltered.reduce((sum, e) => sum + e.amount, 0)
    const change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0

    return { total, byCategory, change, prevTotal }
  }, [expenses, categories, period, currentMonth, currentYear])

  const chartConfig = Object.fromEntries(
    categories.map((cat) => [cat.id, { label: cat.label, color: cat.color }])
  )

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const periodLabel = { dia: "hoy", semana: "semana", mes: monthNames[currentMonth], anio: currentYear }
  const prevPeriodLabel = { dia: "ayer", semana: "seman. ant.", mes: "mes ant.", anio: "año ant." }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom-10 duration-500 overflow-y-auto pb-10">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md border-b border-white/5">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-muted/50 active-press">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest">Estadísticas</h1>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        {/* Selector de periodo estilizado */}
        <div className="flex gap-1 rounded-[1.5rem] bg-muted/30 p-1 border border-white/5">
          {[
            { key: "dia", label: "Día", icon: CalendarDays },
            { key: "semana", label: "Sem.", icon: CalendarClock },
            { key: "mes", label: "Mes", icon: CalendarRange },
            { key: "anio", label: "Año", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key as TimePeriod)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-tight transition-all active-press ${
                period === tab.key 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[2rem] bg-card p-6 border border-white/5 shadow-xl shadow-black/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Gastado {periodLabel[period]}</span>
            <p className="mt-2 text-3xl font-black tracking-tighter tabular-nums">{formatCurrency(stats.total)}</p>
          </div>
          <div className="rounded-[2rem] bg-card p-6 border border-white/5 shadow-xl shadow-black/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">vs {prevPeriodLabel[period]}</span>
            <div className={`mt-2 flex items-center gap-1 font-black text-3xl tracking-tighter tabular-nums ${stats.change >= 0 && stats.total > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {stats.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {Math.abs(stats.change)}%
            </div>
          </div>
        </div>

        {/* Gráfico de Barras Horizontales */}
        <div className="rounded-[2.5rem] bg-card p-6 border border-white/5 shadow-2xl">
          <h2 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Distribución de Gastos</h2>
          
          {stats.total > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} layout="vertical" margin={{ left: -10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    tick={{ fill: "currentColor", fontSize: 11, fontWeight: 800, opacity: 0.8 }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                    content={<ChartTooltipContent hideLabel className="rounded-2xl border-white/10 bg-black/90 text-white" />} 
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={24}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill} 
                        style={{ filter: `drop-shadow(0px 0px 4px ${entry.fill}40)` }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center gap-4 text-muted-foreground/30">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="h-8 w-8" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Sin datos en este periodo</p>
            </div>
          )}
        </div>

        {/* Listado de Ranking con barras de progreso */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Análisis detallado</h2>
          {stats.byCategory.map((cat, i) => (
            <div 
              key={cat.category} 
              className="group rounded-[2rem] bg-card p-5 border border-white/5 shadow-lg animate-entrance"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[1.2rem] flex items-center justify-center text-2xl shadow-inner shadow-white/5" style={{ backgroundColor: `${cat.fill}20`, color: cat.fill }}>
                    {cat.emoji}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tight">{cat.label}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{cat.percentage}% de tus gastos</span>
                  </div>
                </div>
                <span className="font-black text-lg tabular-nums">{formatCurrency(cat.amount)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px] shadow-current" 
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.fill, color: `${cat.fill}40` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
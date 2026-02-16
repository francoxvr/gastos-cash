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
    // Normalizar fechas para comparación (00:00:00)
    const todayTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime()

    // 1. Filtrar gastos del periodo actual
    const filtered = expenses.filter((expense) => {
      const [year, month, day] = expense.date.split('-').map(Number)
      const expenseTime = new Date(year, month - 1, day).getTime()

      if (period === "dia") return expenseTime === todayTarget
      if (period === "semana") return expenseTime >= weekStart && expenseTime <= now.getTime()
      if (period === "mes") return (month - 1) === currentMonth && year === currentYear
      return year === currentYear
    })

    const total = filtered.reduce((sum, e) => sum + e.amount, 0)

    // 2. Agrupar por categoría
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

    // 3. Calcular periodo anterior para el % de cambio
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
    <div className="flex min-h-screen flex-col bg-background animate-entrance">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md border-b border-border/10">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted active-press">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Estadísticas</h1>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-20">
        {/* Selector de periodo estilizado */}
        <div className="flex gap-1.5 rounded-2xl bg-muted/50 p-1.5 border border-border/50">
          {[
            { key: "dia", label: "Día", icon: CalendarDays },
            { key: "semana", label: "Sem.", icon: CalendarClock },
            { key: "mes", label: "Mes", icon: CalendarRange },
            { key: "anio", label: "Año", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key as TimePeriod)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-tight transition-all active-press ${
                period === tab.key ? "bg-background text-primary shadow-sm border border-border/10" : "text-muted-foreground opacity-70"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[2rem] bg-card p-6 border border-border/40 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gastado {periodLabel[period]}</span>
            <p className="mt-2 text-2xl font-black tracking-tighter">{formatCurrency(stats.total)}</p>
          </div>
          <div className="rounded-[2rem] bg-card p-6 border border-border/40 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">vs {prevPeriodLabel[period]}</span>
            <div className={`mt-2 flex items-center gap-1 font-black text-2xl tracking-tighter ${stats.change >= 0 ? "text-destructive" : "text-primary"}`}>
              {stats.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stats.change)}%
            </div>
          </div>
        </div>

        {/* Gráfico de Barras Horizontales */}
        <div className="rounded-[2.5rem] bg-card p-6 border border-border/40 shadow-sm">
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">Distribución por Categoría</h2>
          
          {stats.total > 0 ? (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} layout="vertical" margin={{ left: -20, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                    tick={{ fill: "currentColor", fontSize: 10, fontWeight: 700 }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                    content={<ChartTooltipContent hideLabel />} 
                  />
                  <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={20}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground/40">
              <BarChart3 className="h-12 w-12" />
              <p className="text-xs font-bold uppercase">No hay datos suficientes</p>
            </div>
          )}
        </div>

        {/* Listado Detallado de Categorías */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Ranking de gastos</h2>
          {stats.byCategory.map((cat) => (
            <div key={cat.category} className="group rounded-3xl bg-card p-4 border border-border/40 shadow-sm transition-all hover:border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.fill}15` }}>
                    {cat.emoji}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{cat.label}</span>
                    <span className="text-[10px] font-bold text-primary opacity-80">{cat.percentage}% del total</span>
                  </div>
                </div>
                <span className="font-black text-foreground">{formatCurrency(cat.amount)}</span>
              </div>
              {/* Barra de progreso */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${cat.percentage}%`, backgroundColor: cat.fill }} 
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
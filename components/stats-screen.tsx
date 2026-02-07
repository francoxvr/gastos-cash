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
      const expenseDate = new Date(year, month - 1, day).getTime()

      if (period === "dia") return expenseDate === todayTarget
      if (period === "semana") return expenseDate >= weekStart && expenseDate <= now.getTime()
      if (period === "mes") {
        const d = new Date(year, month - 1, day)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      }
      return year === currentYear
    })

    const total = filtered.reduce((sum, e) => sum + e.amount, 0)
    const count = filtered.length

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
    })

    const prevFiltered = expenses.filter((expense) => {
      const [year, month, day] = expense.date.split('-').map(Number)
      const expenseDate = new Date(year, month - 1, day).getTime()

      if (period === "dia") {
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
        return expenseDate === yesterday
      }
      if (period === "semana") {
        const prevWeekStart = weekStart - (7 * 24 * 60 * 60 * 1000)
        return expenseDate >= prevWeekStart && expenseDate < weekStart
      }
      if (period === "mes") {
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        const d = new Date(year, month - 1, day)
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear
      }
      return year === currentYear - 1
    })

    const prevTotal = prevFiltered.reduce((sum, e) => sum + e.amount, 0)
    const change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0

    return { total, count, byCategory, change, prevTotal }
  }, [expenses, categories, period, currentMonth, currentYear])

  const chartConfig = Object.fromEntries(
    categories.map((cat) => [cat.id, { label: cat.label, color: cat.color }])
  )

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

  const periodLabel = { dia: "de hoy", semana: "de esta semana", mes: `de ${monthNames[currentMonth]}`, anio: `de ${currentYear}` }
  const prevPeriodLabel = { dia: "ayer", semana: "semana anterior", mes: monthNames[currentMonth === 0 ? 11 : currentMonth - 1], anio: `${currentYear - 1}` }

  return (
    <div className="flex min-h-screen flex-col bg-background animate-in fade-in duration-300">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md border-b border-border/5">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-all hover:bg-muted active:scale-90">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Estadísticas</h1>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-4">
        {/* Selector de periodo */}
        <div className="flex gap-2 rounded-xl bg-card p-1.5 shadow-sm border border-border/10">
          {[
            { key: "dia", label: "Día", icon: CalendarDays },
            { key: "semana", label: "Semana", icon: CalendarClock },
            { key: "mes", label: "Mes", icon: CalendarRange },
            { key: "anio", label: "Año", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key as TimePeriod)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                period === tab.key ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tarjetas de resumen */}
        <div key={period} className="flex gap-3">
          <div className="flex flex-1 flex-col rounded-2xl bg-card p-5 shadow-sm border border-border/5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total {periodLabel[period]}</p>
            <p className="mt-1 text-2xl font-bold text-foreground tracking-tight">{formatCurrency(stats.total)}</p>
          </div>
          <div className="flex flex-1 flex-col rounded-2xl bg-card p-5 shadow-sm border border-border/5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">vs {prevPeriodLabel[period]}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {stats.change >= 0 ? <TrendingUp className="h-5 w-5 text-destructive" /> : <TrendingDown className="h-5 w-5 text-primary" />}
              <span className={`text-2xl font-bold tracking-tight ${stats.change >= 0 ? "text-destructive" : "text-primary"}`}>
                {stats.change > 0 ? "+" : ""}{stats.change}%
              </span>
            </div>
          </div>
        </div>

        {/* Sección del Gráfico Corregida */}
        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border/5">
          <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
            Estadística de consumo
          </h2>
          {stats.total > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory.filter((c) => c.amount > 0)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    width={100} // Espacio aumentado para que no se corten los nombres
                    tick={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }} 
                    content={
                      <ChartTooltipContent 
                        hideLabel // Elimina la palabra "amount"
                        formatter={(value) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Monto</span>
                            <span className="font-bold text-foreground">{formatCurrency(Number(value))}</span>
                          </div>
                        )}
                      />
                    } 
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={24}>
                    {stats.byCategory.filter((c) => c.amount > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <BarChart3 className="h-10 w-10 opacity-10" />
              <p className="text-sm font-medium">Sin movimientos registrados</p>
            </div>
          )}
        </div>

        {/* Gastos detallados */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-foreground px-1">Gastos detallados</h2>
          {stats.byCategory
            .filter((cat) => cat.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .map((cat) => (
              <div key={cat.category} className="rounded-2xl bg-card p-4 shadow-sm border border-border/5 transition-all active:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: `${cat.fill}20` }}>
                      {cat.emoji}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">{cat.label}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{cat.percentage}%</span>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${cat.percentage}%`, backgroundColor: cat.fill }} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
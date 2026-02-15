"use client"

import { useMemo, useState } from "react"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency } from "@/lib/expenses"
import type { Expense } from "@/lib/expenses"
import { ChevronLeft, ChevronRight } from "lucide-react"

const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function ExpenseCalendar() {
  const { expenses, getCategoryById } = useExpenses()
  const today = new Date()

  // Hoy en formato YYYY-MM-DD local
  const todayStr = today.toLocaleDateString('en-CA'); // Formato ISO local YYYY-MM-DD

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const expensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>()
    expenses.forEach(expense => {
      const [year, month] = expense.date.split("-").map(Number)
      if (month - 1 === viewMonth && year === viewYear) {
        const list = map.get(expense.date) || []
        list.push(expense)
        map.set(expense.date, list)
      }
    })
    return map
  }, [expenses, viewMonth, viewYear])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [viewMonth, viewYear])

  const navigateMonth = (direction: number) => {
    const newDate = new Date(viewYear, viewMonth + direction, 1)
    setViewMonth(newDate.getMonth())
    setViewYear(newDate.getFullYear())
    setSelectedDate(null)
  }

  const getDateStr = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${viewYear}-${m}-${d}`
  }

  const selectedExpenses = selectedDate ? (expensesByDate.get(selectedDate) || []) : []
  const selectedTotal = selectedExpenses.reduce((sum, e) => sum + e.amount, 0)

  const monthTotal = useMemo(() => {
    return Array.from(expensesByDate.values())
      .flat()
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expensesByDate])

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Navegación de Mes */}
      <div className="flex items-center justify-between rounded-3xl bg-card p-4 shadow-sm border border-border/40">
        <button onClick={() => navigateMonth(-1)} className="p-2 rounded-full hover:bg-muted active-press">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold capitalize">{monthNames[viewMonth]} {viewYear}</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{formatCurrency(monthTotal)}</p>
        </div>
        <button onClick={() => navigateMonth(1)} className="p-2 rounded-full hover:bg-muted active-press">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grid del Calendario */}
      <div className="rounded-[2rem] bg-card p-5 shadow-sm border border-border/40">
        <div className="mb-4 grid grid-cols-7 text-center">
          {dayNames.map((day) => (
            <span key={day} className="text-[10px] font-bold uppercase text-muted-foreground/60">{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} />

            const dateStr = getDateStr(day)
            const dayExpenses = expensesByDate.get(dateStr) || []
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate

            // Clases de intensidad basadas en el gasto
            let intensity = "hover:bg-muted text-foreground"
            if (dayExpenses.length > 0) {
              if (dayTotal > 5000) intensity = "bg-primary text-primary-foreground"
              else if (dayTotal > 2000) intensity = "bg-primary/60 text-primary-foreground"
              else intensity = "bg-primary/20 text-primary font-bold"
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition-all active-press
                  ${isSelected ? "ring-2 ring-primary ring-offset-4 ring-offset-background z-10 scale-110 shadow-lg" : ""}
                  ${isToday && !dayExpenses.length ? "border-2 border-primary/30 font-black" : ""}
                  ${intensity}
                `}
              >
                <span className={isSelected ? "font-bold" : ""}>{day}</span>
                {dayExpenses.length > 0 && !isSelected && (
                  <span className="absolute bottom-2 h-1 w-1 rounded-full bg-current opacity-50" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDate && (
        <div className="flex flex-col gap-3 animate-entrance">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-AR", {
                weekday: "short", day: "numeric", month: "short"
              })}
            </h3>
            <span className="text-lg font-bold text-primary">{formatCurrency(selectedTotal)}</span>
          </div>

          <div className="space-y-2">
            {selectedExpenses.length > 0 ? (
              selectedExpenses.map((expense) => {
                const cat = getCategoryById(expense.category)
                return (
                  <div key={expense.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 border border-border/40 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xl">
                      {cat?.emoji || "💸"}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{expense.description || cat?.label}</span>
                      <span className="text-xs text-muted-foreground capitalize">{cat?.label}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(expense.amount)}</span>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border/40 py-8 text-center text-sm text-muted-foreground">
                No hay gastos registrados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
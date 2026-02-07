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

  // --- CORRECCIÓN DE HOY (ZONA HORARIA LOCAL) ---
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const expensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const expense of expenses) {
      // Usamos el formato local para la comparación
      const [year, month, day] = expense.date.split("-").map(Number)
      if (month - 1 === viewMonth && year === viewYear) {
        const key = expense.date
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(expense)
      }
    }
    return map
  }, [expenses, viewMonth, viewYear])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const days: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d)
    }
    return days
  }, [viewMonth, viewYear])

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
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
    let total = 0
    for (const exps of expensesByDate.values()) {
      for (const e of exps) {
        total += e.amount
      }
    }
    return total
  }, [expensesByDate])

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="animate-slide-up flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
        <button
          onClick={prevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold text-foreground">
            {monthNames[viewMonth]} {viewYear}
          </h2>
          <p className="text-xs text-muted-foreground">
            Total: {formatCurrency(monthTotal)}
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted active:scale-90"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="animate-scale-in rounded-2xl bg-card p-4 shadow-sm">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="aspect-square" />

            const dateStr = getDateStr(day)
            const hasExpenses = expensesByDate.has(dateStr)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const dayTotal = hasExpenses
              ? expensesByDate.get(dateStr)!.reduce((sum, e) => sum + e.amount, 0)
              : 0

            let intensityClass = ""
            if (hasExpenses) {
              if (dayTotal > 3000) intensityClass = "bg-primary text-primary-foreground"
              else if (dayTotal > 1500) intensityClass = "bg-primary/70 text-primary-foreground"
              else intensityClass = "bg-primary/30 text-foreground"
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 active:scale-90
                  ${isSelected
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-card scale-105"
                    : hasExpenses
                      ? intensityClass
                      : isToday
                        ? "bg-muted font-bold ring-2 ring-primary/20 text-foreground" // Resaltamos HOY correctamente
                        : "text-foreground hover:bg-muted"
                  }
                `}
              >
                <span>{day}</span>
                {hasExpenses && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-70" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="animate-slide-up flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(selectedTotal)}
            </span>
          </div>

          {selectedExpenses.length > 0 ? (
            selectedExpenses.map((expense, i) => {
              const cat = getCategoryById(expense.category)
              return (
                <div
                  key={expense.id}
                  className="animate-slide-up flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm"
                >
                  <span className="text-xl">{cat?.emoji || "❓"}</span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {expense.description || cat?.label}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center rounded-xl bg-card py-6 text-sm text-muted-foreground shadow-sm">
              Sin gastos este día
            </div>
          )}
        </div>
      )}
    </div>
  )
}
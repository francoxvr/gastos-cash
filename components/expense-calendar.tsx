"use client"

import { useMemo, useState } from "react"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency } from "@/lib/expenses"
import type { Expense } from "@/lib/expenses"
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
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

const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface ExpenseCalendarProps {
  onEdit: (expense: Expense) => void
}

export function ExpenseCalendar({ onEdit }: ExpenseCalendarProps) {
  const { expenses, getCategoryById, deleteExpense } = useExpenses()
  const today = new Date()

  // Hoy en formato YYYY-MM-DD local
  const todayStr = today.toLocaleDateString('en-CA'); // Formato ISO local YYYY-MM-DD

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteExpense(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

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
      <div className="flex items-center justify-between rounded-3xl surface-card p-4">
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
      <div className="rounded-3xl surface-card p-5">
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
              if (dayTotal > 5000) intensity = "gradient-brand text-primary-foreground"
              else if (dayTotal > 2000) intensity = "bg-primary/60 text-primary-foreground"
              else intensity = "bg-primary/20 text-primary font-bold"
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition-all active-press
                  ${isSelected ? "ring-2 ring-primary ring-offset-4 ring-offset-background z-10 scale-110 shadow-lg" : ""}
                  ${isToday && !dayExpenses.length ? "gradient-ring font-black" : ""}
                  ${intensity}
                `}
              >
                <span className={`relative z-10 ${isSelected ? "font-bold" : ""}`}>{day}</span>
                {dayExpenses.length > 0 && !isSelected && (
                  <span className="absolute z-10 bottom-2 h-1 w-1 rounded-full bg-current opacity-50" />
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
                  <div key={expense.id} className="flex items-center gap-4 rounded-2xl surface-card p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xl">
                      {cat?.emoji || "💸"}
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="text-sm font-semibold truncate">{expense.description || cat?.label}</span>
                      <span className="text-xs text-muted-foreground capitalize">{cat?.label}</span>
                    </div>
                    <span className="font-bold shrink-0">{formatCurrency(expense.amount)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEdit(expense)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted active-press"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(expense)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 active-press"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
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

      {/* Confirmación de Borrado */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>
            <AlertDialogDescription className="text-balance">
              Se borrará el registro de <span className="font-bold text-foreground">{deleteTarget && formatCurrency(deleteTarget.amount)}</span> de la categoría <span className="font-bold text-foreground">{deleteTarget && (getCategoryById(deleteTarget.category)?.label || "Sin categoría")}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 rounded-2xl mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
"use client"

import React, { useState } from "react"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency, formatDate } from "@/lib/expenses"
import type { Expense } from "@/lib/expenses"
import { Pencil, Trash2 } from "lucide-react"
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

interface ExpenseListProps {
  onEdit: (expense: Expense) => void
}

export function ExpenseList({ onEdit }: ExpenseListProps) {
  const { expenses, deleteExpense, getCategoryById } = useExpenses()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const handleToggleActions = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteExpense(deleteTarget.id)
      setDeleteTarget(null)
      setExpandedId(null)
    }
  }

  const handleEdit = (expense: Expense) => {
    setExpandedId(null)
    onEdit(expense)
  }

  if (expenses.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No hay gastos registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {expenses.slice(0, 20).map((expense, index) => {
          const cat = getCategoryById(expense.category)
          const emoji = cat?.emoji || "\u{2753}"
          const label = cat?.label || expense.category
          const color = cat?.color || "hsl(220, 15%, 50%)"

          return (
            <div
              key={expense.id}
              className={`animate-slide-up overflow-hidden rounded-xl shadow-sm transition-all duration-300 stagger-${Math.min(index + 1, 10)} ${
                expandedId === expense.id
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "bg-card hover:shadow-md"
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => handleToggleActions(expense.id)}
                  className="flex flex-1 items-center gap-4 p-4 text-left transition-colors active:opacity-80"
                  aria-label={`${label}, ${formatCurrency(expense.amount)}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl transition-all duration-200 active:scale-90 ${
                      expandedId === expense.id
                        ? "bg-primary-foreground/20"
                        : ""
                    }`}
                    style={
                      expandedId === expense.id
                        ? undefined
                        : { backgroundColor: `${color}20` }
                    }
                  >
                    {emoji}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className={`font-medium ${expandedId === expense.id ? "text-primary-foreground" : "text-foreground"}`}>
                      {label}
                    </span>
                    <span className={`text-sm ${expandedId === expense.id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                      {formatDate(expense.date)}
                    </span>
                  </div>
                  <span className={`text-lg font-semibold tabular-nums ${expandedId === expense.id ? "text-primary-foreground" : "text-foreground"}`}>
                    {formatCurrency(expense.amount)}
                  </span>
                </button>
              </div>

              {expandedId === expense.id && (
                <div className="animate-expand-height flex overflow-hidden rounded-b-xl">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="flex flex-1 items-center justify-center gap-2 bg-card py-3 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-95"
                    aria-label="Editar gasto"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => setDeleteTarget(expense)}
                    className="flex flex-1 items-center justify-center gap-2 bg-card py-3 text-sm font-medium text-destructive transition-all duration-200 hover:bg-muted active:scale-95"
                    aria-label="Eliminar gasto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="animate-scale-in mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el gasto de{" "}
              <span className="font-semibold">
                {deleteTarget ? formatCurrency(deleteTarget.amount) : ""}
              </span>{" "}
              en {deleteTarget ? (getCategoryById(deleteTarget.category)?.label || deleteTarget.category) : ""}.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

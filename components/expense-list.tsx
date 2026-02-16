"use client"

import React, { useState } from "react"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency, formatDate } from "@/lib/expenses"
import type { Expense } from "@/lib/expenses"
import { Pencil, Trash2, ChevronDown } from "lucide-react"
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

  // Ordenar gastos: más recientes primero
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleToggleActions = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteExpense(deleteTarget.id)
      setDeleteTarget(null)
      setExpandedId(null)
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 text-4xl">
          ☕
        </div>
        <p className="text-muted-foreground font-medium">No hay gastos registrados aún</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Toca el botón "+" para empezar</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {sortedExpenses.slice(0, 30).map((expense, index) => {
          const cat = getCategoryById(expense.category)
          const isExpanded = expandedId === expense.id
          
          return (
            <div
              key={expense.id}
              className={`group relative overflow-hidden rounded-[2rem] transition-all duration-300 animate-entrance
                ${isExpanded ? "bg-primary shadow-xl shadow-primary/20" : "bg-card border border-border/40"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => handleToggleActions(expense.id)}
                className="flex w-full items-center gap-4 p-4 text-left active-press"
              >
                {/* Icono / Emoji */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors
                    ${isExpanded ? "bg-white/20" : "bg-muted"}`}
                  style={!isExpanded && cat?.color ? { backgroundColor: `${cat.color}15`, color: cat.color } : undefined}
                >
                  {cat?.emoji || "❓"}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className={`font-bold truncate ${isExpanded ? "text-primary-foreground" : "text-foreground"}`}>
                    {cat?.label || "Sin categoría"}
                  </span>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider overflow-hidden
                    ${isExpanded ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    <span className="shrink-0">{formatDate(expense.date)}</span>
                    {expense.description && (
                      <>
                        <span className="shrink-0 opacity-50">•</span>
                        <span className="truncate italic normal-case font-medium">
                          {expense.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Importe */}
                <div className="flex flex-col items-end gap-1 pr-4 shrink-0">
                  <span className={`text-lg font-black tabular-nums ${isExpanded ? "text-primary-foreground" : "text-foreground"}`}>
                    {formatCurrency(expense.amount)}
                  </span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 
                    ${isExpanded ? "rotate-180 text-primary-foreground" : "text-muted-foreground/30"}`} 
                  />
                </div>
              </button>

              {/* Acciones Expandibles - FONDO GRIS CON ÉNFASIS */}
              {isExpanded && (
                <div className="flex border-t border-white/10 animate-slide-down">
                  {/* Botón Editar - GRIS CON CÍRCULO CELESTE-VERDE */}
                  <button
                    onClick={() => { onEdit(expense); setExpandedId(null); }}
                    className="flex flex-1 items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all active-press 
                      bg-gray-500/30 hover:bg-gray-500/40 text-white"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg">
                      <Pencil className="h-4 w-4 text-white" />
                    </div>
                    Editar
                  </button>
                  
                  {/* Divisor */}
                  <div className="w-[1px] bg-white/10 my-4" />
                  
                  {/* Botón Eliminar - GRIS CON CÍRCULO CELESTE-VERDE */}
                  <button
                    onClick={() => setDeleteTarget(expense)}
                    className="flex flex-1 items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all active-press
                      bg-gray-500/30 hover:bg-gray-500/40 text-white"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg">
                      <Trash2 className="h-4 w-4 text-white" />
                    </div>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

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
    </>
  )
}
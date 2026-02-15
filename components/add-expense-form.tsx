"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import type { Expense } from "@/lib/expenses"
import { ArrowLeft, Check, Calendar as CalendarIcon, Type } from "lucide-react"

interface AddExpenseFormProps {
  onClose: () => void
  editingExpense?: Expense | null
}

export function AddExpenseForm({ onClose, editingExpense }: AddExpenseFormProps) {
  const { addExpense, updateExpense, categories } = useExpenses()
  const isEditing = !!editingExpense

  // Obtiene la fecha actual en formato YYYY-MM-DD local
  const getLocalDate = () => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  const [amount, setAmount] = useState(isEditing ? editingExpense.amount.toString() : "")
  const [category, setCategory] = useState(isEditing ? editingExpense.category : categories[0]?.id || "")
  const [date, setDate] = useState(isEditing ? editingExpense.date : getLocalDate())
  const [description, setDescription] = useState(isEditing ? editingExpense.description : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isInvalid = !amount || Number.parseFloat(amount) <= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isInvalid) return

    setIsSubmitting(true)

    const expenseData = {
      amount: Number.parseFloat(amount),
      category,
      date,
      description: description.trim() // Ahora permitimos que sea opcional sin forzar el nombre de la categoría aquí, ya que el ExpenseList lo maneja
    }

    if (isEditing && editingExpense) {
      await updateExpense(editingExpense.id, expenseData)
    } else {
      await addExpense(expenseData)
    }

    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in overflow-y-auto">
      {/* Header Estilo App Nativa */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background/80 px-4 py-6 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground transition-all active-press"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest">
          {isEditing ? "Editar" : "Nuevo Gasto"}
        </h1>
        <div className="w-12" /> {/* Espaciador para centrar el título */}
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-8 px-6 pb-10">
        
        {/* Input de Monto Gigante */}
        <div className="mt-4 flex flex-col items-center justify-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute -left-8 text-4xl font-black opacity-20">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              className="w-full bg-transparent text-center text-7xl font-black outline-none placeholder:opacity-10 tabular-nums"
              autoFocus
              required
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Monto del gasto</p>
        </div>

        {/* Selector de Categorías (Burbujas modernas) */}
        <div className="flex flex-col gap-4">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Seleccionar Categoría</Label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 rounded-[2rem] border-2 py-5 transition-all duration-300 active-press ${
                    isSelected 
                    ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
                    : "border-border/40 bg-card text-muted-foreground opacity-60"
                  }`}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Otros Detalles */}
        <div className="space-y-4">
           {/* Descripción */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              <Type className="h-5 w-5" />
            </div>
            <input
              placeholder="¿En qué lo gastaste? (Opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 w-full rounded-3xl bg-muted/40 pl-12 pr-4 text-base font-bold outline-none ring-primary/20 transition-all focus:ring-4 focus:bg-muted/20"
            />
          </div>

          {/* Fecha */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-16 w-full rounded-3xl bg-muted/40 pl-12 pr-4 text-base font-bold outline-none ring-primary/20 transition-all focus:ring-4 focus:bg-muted/20"
            />
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={isInvalid || isSubmitting}
            className={`flex h-20 w-full items-center justify-center gap-3 rounded-[2.5rem] text-lg font-black uppercase tracking-[0.2em] transition-all active-press shadow-2xl ${
              isSubmitting 
              ? "bg-green-500 text-white" 
              : "bg-primary text-primary-foreground shadow-primary/30"
            } disabled:opacity-30 disabled:grayscale`}
          >
            {isSubmitting ? (
              <>
                <Check className="h-7 w-7 animate-bounce" /> ¡Guardado!
              </>
            ) : (
              <>
                {isEditing ? "Actualizar" : "Confirmar Gasto"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
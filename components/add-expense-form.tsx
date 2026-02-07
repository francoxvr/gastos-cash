"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import type { Expense } from "@/lib/expenses"
import { ArrowLeft, Check } from "lucide-react"

const SELECTED_STYLE = "bg-primary text-primary-foreground border-primary shadow-md"
const UNSELECTED_STYLE = "border-border bg-card text-muted-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-foreground hover:shadow-md"

interface AddExpenseFormProps {
  onClose: () => void
  editingExpense?: Expense | null
}

export function AddExpenseForm({ onClose, editingExpense }: AddExpenseFormProps) {
  const { addExpense, categories } = useExpenses()
  const isEditing = !!editingExpense

  const getLocalDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const [amount, setAmount] = useState(isEditing ? editingExpense.amount.toString() : "")
  const [category, setCategory] = useState(isEditing ? editingExpense.category : categories[0]?.id || "")
  const [date, setDate] = useState(isEditing ? editingExpense.date : getLocalDate())
  const [description, setDescription] = useState(isEditing ? editingExpense.description : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isInvalid = !amount || Number.parseFloat(amount) <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isInvalid) return

    setIsSubmitting(true)

    // Obtener el nombre de la categoría
    const categoryName = categories.find(c => c.id === category)?.label || category

    const expenseData = {
      amount: Number.parseFloat(amount),
      category,
      date,
      description: description.trim() || categoryName // Si está vacío, usar el nombre de la categoría
    }

    await addExpense(expenseData)

    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
    }, 600)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-all duration-200 hover:bg-muted active:scale-90"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">
          {isEditing ? "Editar gasto" : "Agregar gasto"}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-4 pb-8">
        <div className="flex flex-col gap-3">
          <Label htmlFor="amount" className="text-base font-medium">Monto</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              className="h-16 pl-8 text-3xl font-bold focus:shadow-lg"
              autoFocus
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-base font-medium">Categoría</Label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 text-center transition-all duration-300 active:scale-95 ${
                  category === cat.id ? SELECTED_STYLE : UNSELECTED_STYLE
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium leading-tight">{cat.label}</span>
                {category === cat.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="description" className="text-base font-medium">Descripción (opcional)</Label>
          <Input
            id="description"
            type="text"
            placeholder="Ej: Compra semanal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-14 text-base focus:shadow-lg"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="date" className="text-base font-medium">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-14 text-base focus:shadow-lg"
          />
        </div>

        <div className="mt-auto pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={isInvalid || isSubmitting}
            className={`h-14 w-full text-lg font-semibold shadow-lg transition-all duration-200 active:scale-[0.97] ${
              isInvalid 
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Check className="h-6 w-6" />
                Guardado
              </span>
            ) : isEditing ? (
              "Guardar cambios"
            ) : (
              "Guardar gasto"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
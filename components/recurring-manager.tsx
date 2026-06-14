"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency } from "@/lib/expenses"
import { ArrowLeft, Plus, Trash2, X, Repeat } from "lucide-react"
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

interface RecurringManagerProps {
  onClose: () => void
}

export function RecurringManager({ onClose }: RecurringManagerProps) {
  const { recurringExpenses, categories, getCategoryById, addRecurring, deleteRecurring } = useExpenses()
  const [showAddForm, setShowAddForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(categories[0]?.id || "")
  const [description, setDescription] = useState("")
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

  const handleAdd = async () => {
    const parsedAmount = Number(amount)
    const parsedDay = Math.min(28, Math.max(1, Number(dayOfMonth) || 1))
    if (!parsedAmount || parsedAmount <= 0 || !category) return

    await addRecurring({
      amount: parsedAmount,
      category,
      description: description.trim(),
      dayOfMonth: parsedDay,
    })

    setAmount("")
    setDescription("")
    setDayOfMonth("1")
    setShowAddForm(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteRecurring(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background animate-fade-in">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-2xl surface-card active-press"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-extrabold">Gastos recurrentes</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        {recurringExpenses.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 text-4xl">
              <Repeat className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No tenés gastos recurrentes</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Ej: alquiler, suscripciones, servicios</p>
          </div>
        )}

        {/* Lista de recurrentes */}
        <div className="flex flex-col gap-2">
          {recurringExpenses.map((rec, index) => {
            const cat = getCategoryById(rec.category)
            return (
              <div
                key={rec.id}
                className="flex items-center gap-4 rounded-2xl surface-card p-4 animate-entrance"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: `${cat?.color || "#888"}20` }}
                >
                  {cat?.emoji || "🔁"}
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="font-bold truncate">{rec.description || cat?.label || "Gasto recurrente"}</span>
                  <span className="text-xs text-muted-foreground">
                    Día {rec.dayOfMonth} de cada mes · {formatCurrency(rec.amount)}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: rec.id, label: rec.description || cat?.label || "este gasto recurrente" })}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors active-press"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Formulario para añadir */}
        {showAddForm && (
          <div className="animate-scale-in flex flex-col gap-4 rounded-3xl surface-card p-5 shadow-lg mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nuevo gasto recurrente</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-muted rounded-full active-press">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rec-amount">Monto</Label>
                <Input
                  id="rec-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="Ej: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rec-description">Descripción</Label>
                <Input
                  id="rec-description"
                  placeholder="Ej: Alquiler"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active-press ${
                        category === cat.id ? "gradient-brand text-primary-foreground" : "surface-card text-muted-foreground"
                      }`}
                    >
                      <span>{cat.emoji}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rec-day">Día del mes</Label>
                <Input
                  id="rec-day"
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <Button onClick={handleAdd} disabled={!amount || Number(amount) <= 0} className="w-full h-12 rounded-2xl active-press">
                Guardar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante inferior */}
      {!showAddForm && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={() => setShowAddForm(true)} size="lg" className="w-full h-14 text-lg rounded-2xl shadow-xl active-press">
            <Plus className="mr-2 h-6 w-6" /> Agregar gasto recurrente
          </Button>
        </div>
      )}

      {/* Confirmación de borrado */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.label}" dejará de recordarse cada mes. Esto no borra los gastos ya registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

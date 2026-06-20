"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import { useAuth } from "@/context/auth-context"
import type { Expense } from "@/lib/expenses"
import { ArrowLeft, Check, Calendar as CalendarIcon, Type, StickyNote } from "lucide-react"

interface AddExpenseFormProps {
  onClose: () => void
  editingExpense?: Expense | null
}

export function AddExpenseForm({ onClose, editingExpense }: AddExpenseFormProps) {
  const { addExpense, updateExpense, categories, currencies, getBaseCurrency, getCurrencyByCode, members, memberEmails } = useExpenses()
  const { user } = useAuth()
  const isEditing = !!editingExpense

  // Obtiene la fecha actual en formato YYYY-MM-DD local
  const getLocalDate = () => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  const [type, setType] = useState<"expense" | "income">(isEditing ? (editingExpense.type || "expense") : "expense")
  const [amount, setAmount] = useState(isEditing ? editingExpense.amount.toString() : "")
  const [category, setCategory] = useState(isEditing ? editingExpense.category : categories[0]?.id || "")
  const [date, setDate] = useState(isEditing ? editingExpense.date : getLocalDate())
  const [description, setDescription] = useState(isEditing ? editingExpense.description : "")
  const [currencyCode, setCurrencyCode] = useState(
    isEditing ? (editingExpense.currency || getBaseCurrency().code) : getBaseCurrency().code
  )
  const [paidBy, setPaidBy] = useState(
    isEditing ? (editingExpense.paidBy || user?.uid || "") : (user?.uid || "")
  )
  const [notes, setNotes] = useState(isEditing ? (editingExpense.notes || "") : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCurrency = getCurrencyByCode(currencyCode)

  const isInvalid = !amount || Number.parseFloat(amount) <= 0

  // Formatea el monto para mostrarlo con puntos de mil (ej: 700000 -> 700.000)
  const formatAmountDisplay = (value: string) => {
    if (!value) return ""
    const [intPart, decPart] = value.split(".")
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Quita los puntos de mil y convierte la coma decimal en punto
    let cleaned = e.target.value.replace(/\./g, "").replace(",", ".")
    cleaned = cleaned.replace(/[^0-9.]/g, "")
    const parts = cleaned.split(".")
    if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("")
    setAmount(cleaned)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isInvalid) return

    setIsSubmitting(true)

    const expenseData = {
      amount: Number.parseFloat(amount),
      category: type === "income" ? "" : category,
      date,
      description: description.trim(), // Ahora permitimos que sea opcional sin forzar el nombre de la categoría aquí, ya que el ExpenseList lo maneja
      type,
      currency: selectedCurrency.code,
      exchangeRate: selectedCurrency.rateToBase,
      paidBy: paidBy || user?.uid || "",
      notes: notes.trim() || undefined,
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
          className="flex h-12 w-12 items-center justify-center rounded-2xl surface-card text-foreground transition-all active-press"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest">
          {isEditing ? "Editar" : type === "income" ? "Nuevo Ingreso" : "Nuevo Gasto"}
        </h1>
        <div className="w-12" /> {/* Espaciador para centrar el título */}
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-8 px-6 pb-10">

        {/* Selector Gasto / Ingreso */}
        <div className="flex gap-1 rounded-2xl surface-card p-1">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active-press ${
                type === t
                  ? t === "income"
                    ? "bg-success text-success-foreground shadow-sm"
                    : "gradient-brand text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {t === "income" ? "Ingreso" : "Gasto"}
            </button>
          ))}
        </div>

        {/* Input de Monto Gigante */}
        <div className="mt-4 flex flex-col items-center justify-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute -left-8 text-4xl font-black opacity-20">{selectedCurrency.symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={formatAmountDisplay(amount)}
              onChange={handleAmountChange}
              className="w-full bg-transparent text-center text-7xl font-black outline-none placeholder:opacity-10 tabular-nums"
              autoFocus
              required
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{type === "income" ? "Monto del ingreso" : "Monto del gasto"}</p>
        </div>

        {/* Selector de moneda (solo si hay más de una configurada) */}
        {currencies.length > 1 && (
          <div className="flex gap-1 rounded-2xl surface-card p-1">
            {currencies.map((cur) => (
              <button
                key={cur.id}
                type="button"
                onClick={() => setCurrencyCode(cur.code)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active-press ${
                  currencyCode === cur.code
                    ? "gradient-brand text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {cur.symbol} {cur.code}
              </button>
            ))}
          </div>
        )}

        {/* Selector de Categorías (Burbujas modernas) */}
        {type === "expense" && (
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
                  className={`flex flex-col items-center gap-2 rounded-3xl py-5 transition-all duration-300 active-press ${
                    isSelected
                    ? "gradient-brand text-primary-foreground shadow-xl shadow-primary/20 scale-105"
                    : "surface-card text-muted-foreground opacity-60"
                  }`}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        )}

        {/* Selector de quién pagó (solo en cuentas compartidas) */}
        {type === "expense" && members.length > 1 && (
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Pagado por</Label>
            <div className="flex gap-1 rounded-2xl surface-card p-1">
              {members.map((uid) => (
                <button
                  key={uid}
                  type="button"
                  onClick={() => setPaidBy(uid)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold truncate px-2 transition-all active-press ${
                    paidBy === uid
                      ? "gradient-brand text-primary-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {uid === user?.uid ? "Yo" : (memberEmails[uid] || uid).split("@")[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Otros Detalles */}
        <div className="space-y-4">
           {/* Descripción */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              <Type className="h-5 w-5" />
            </div>
            <input
              placeholder={type === "income" ? "¿De dónde vino? (Opcional)" : "¿En qué lo gastaste? (Opcional)"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 w-full rounded-3xl surface-card pl-12 pr-4 text-base font-bold outline-none ring-primary/20 transition-all focus:ring-4"
            />
          </div>

          {/* Nota */}
          <div className="relative">
            <div className="absolute left-4 top-4 text-muted-foreground/50">
              <StickyNote className="h-5 w-5" />
            </div>
            <textarea
              placeholder="Nota (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-3xl surface-card pl-12 pr-4 pt-4 pb-3 text-base font-bold outline-none ring-primary/20 transition-all focus:ring-4 resize-none"
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
              className="h-16 w-full rounded-3xl surface-card pl-12 pr-4 text-base font-bold outline-none ring-primary/20 transition-all focus:ring-4"
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
              ? "bg-success text-success-foreground"
              : type === "income"
              ? "bg-success text-success-foreground shadow-success/30"
              : "gradient-brand text-primary-foreground shadow-primary/30"
            } disabled:opacity-30 disabled:grayscale`}
          >
            {isSubmitting ? (
              <>
                <Check className="h-7 w-7 animate-bounce" /> ¡Guardado!
              </>
            ) : (
              <>
                {isEditing ? "Actualizar" : type === "income" ? "Confirmar Ingreso" : "Confirmar Gasto"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
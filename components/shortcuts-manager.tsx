"use client"

import React, { useState } from "react"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency } from "@/lib/expenses"
import { ArrowLeft, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ShortcutsManagerProps {
  onClose: () => void
}

export function ShortcutsManager({ onClose }: ShortcutsManagerProps) {
  const { shortcuts, addShortcut, deleteShortcut, categories, getBaseCurrency } = useExpenses()
  const symbol = getBaseCurrency().symbol

  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<"expense" | "income">("expense")
  const [emoji, setEmoji] = useState("⚡")
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    const amt = parseFloat(amount)
    if (!label.trim() || !amt || isNaN(amt)) return
    setSaving(true)
    await addShortcut({ emoji, label: label.trim(), amount: amt, categoryId: type === "income" ? "" : categoryId, description: description.trim(), type })
    setSaving(false)
    setAdding(false)
    setLabel("")
    setAmount("")
    setDescription("")
    setEmoji("⚡")
    setType("expense")
    setCategoryId(categories[0]?.id || "")
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
        <h1 className="text-xl font-extrabold">Accesos rápidos</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        <p className="text-xs text-muted-foreground">
          Registrá gastos frecuentes de un toque desde el inicio.
        </p>

        {shortcuts.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl surface-card p-10 text-center text-muted-foreground/40">
            <span className="text-5xl">⚡</span>
            <p className="text-sm font-bold uppercase tracking-widest">Sin accesos rápidos</p>
          </div>
        )}

        {shortcuts.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-3xl surface-card p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              {s.emoji}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="font-bold truncate">{s.label}</span>
              <span className={`text-xs ${s.type === "income" ? "text-success font-semibold" : "text-muted-foreground"}`}>
                {s.type === "income"
                  ? `+${formatCurrency(s.amount, symbol)} · Ingreso`
                  : `${formatCurrency(s.amount, symbol)} · ${categories.find(c => c.id === s.categoryId)?.emoji} ${categories.find(c => c.id === s.categoryId)?.label}`}
              </span>
            </div>
            <button
              onClick={() => deleteShortcut(s.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive active-press"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {adding ? (
          <div className="flex flex-col gap-4 rounded-3xl surface-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nuevo acceso rápido</p>

            <div className="flex gap-1 rounded-2xl bg-muted p-1">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active-press ${
                    type === t
                      ? t === "income" ? "bg-success text-success-foreground shadow-sm" : "gradient-brand text-primary-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {t === "income" ? "Ingreso" : "Gasto"}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emoji</Label>
                <Input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(-2))}
                  className="w-16 h-12 text-center text-2xl rounded-2xl"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre</Label>
                <Input
                  placeholder="Ej: Cafe cortado"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monto ({symbol})</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="h-12 rounded-2xl font-bold"
              />
            </div>

            {type === "expense" && (
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoría</Label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition-all active-press ${
                        categoryId === cat.id
                          ? "gradient-brand text-primary-foreground shadow-sm"
                          : "surface-card text-muted-foreground opacity-60"
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-[9px] uppercase tracking-tight leading-none">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={!label.trim() || !amount || saving}
                className="flex-1 h-12 rounded-2xl"
              >
                {saving ? "Guardando…" : "Agregar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAdding(false)}
                className="h-12 rounded-2xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border py-5 text-sm font-bold text-muted-foreground transition-all active-press hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Agregar acceso rápido
          </button>
        )}
      </div>
    </div>
  )
}

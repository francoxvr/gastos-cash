"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import { ArrowLeft, Plus, Trash2, X, Check } from "lucide-react"
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

interface CurrencyManagerProps {
  onClose: () => void
}

export function CurrencyManager({ onClose }: CurrencyManagerProps) {
  const { currencies, addCurrency, updateCurrencyRate, deleteCurrency } = useExpenses()
  const [showAddForm, setShowAddForm] = useState(false)
  const [code, setCode] = useState("")
  const [symbol, setSymbol] = useState("")
  const [rate, setRate] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState("")

  const baseCurrency = currencies.find(c => c.isBase)

  const handleAdd = async () => {
    const parsedRate = Number(rate)
    if (!code.trim() || !symbol.trim() || !parsedRate || parsedRate <= 0) return

    await addCurrency({
      code: code.trim().toUpperCase(),
      symbol: symbol.trim(),
      rateToBase: parsedRate,
    })

    setCode("")
    setSymbol("")
    setRate("")
    setShowAddForm(false)
  }

  const handleStartEditRate = (id: string, currentRate: number) => {
    setEditingId(id)
    setEditingRate(String(currentRate))
  }

  const handleSaveRate = (id: string) => {
    const parsed = Number(editingRate)
    if (parsed > 0) updateCurrencyRate(id, parsed)
    setEditingId(null)
    setEditingRate("")
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteCurrency(deleteTarget.id)
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
        <h1 className="text-xl font-extrabold">Monedas</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        <p className="text-xs text-muted-foreground px-1">
          Tu moneda principal es <span className="font-bold">{baseCurrency?.code} ({baseCurrency?.symbol})</span>.
          Agregá otras monedas con su tasa de cambio para registrar gastos en ellas; se convertirán
          automáticamente a {baseCurrency?.code} en los totales.
        </p>

        <div className="flex flex-col gap-2">
          {currencies.map((cur, index) => {
            const isEditing = editingId === cur.id
            return (
              <div
                key={cur.id}
                className="flex items-center gap-4 rounded-2xl surface-card p-4 animate-entrance"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                  {cur.symbol}
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="font-bold truncate">{cur.code}</span>
                  {cur.isBase ? (
                    <span className="text-xs text-muted-foreground">Moneda principal</span>
                  ) : isEditing ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">1 {cur.code} =</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={editingRate}
                        onChange={(e) => setEditingRate(e.target.value)}
                        className="h-8 flex-1 rounded-xl text-sm"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground shrink-0">{baseCurrency?.code}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      1 {cur.code} = {cur.rateToBase} {baseCurrency?.code}
                    </span>
                  )}
                </div>
                {!cur.isBase && (
                  isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveRate(cur.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active-press"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted active-press"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEditRate(cur.id, cur.rateToBase)}
                        className="px-3 py-2 text-xs font-bold text-primary active-press"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: cur.id, label: cur.code })}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors active-press"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )
                )}
              </div>
            )
          })}
        </div>

        {/* Formulario para añadir */}
        {showAddForm && (
          <div className="animate-scale-in flex flex-col gap-4 rounded-3xl surface-card p-5 shadow-lg mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nueva moneda</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-muted rounded-full active-press">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cur-code">Código</Label>
                <Input
                  id="cur-code"
                  placeholder="Ej: USD"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cur-symbol">Símbolo</Label>
                <Input
                  id="cur-symbol"
                  placeholder="Ej: US$"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cur-rate">Tasa de cambio</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">1 {code.trim().toUpperCase() || "..."} =</span>
                  <Input
                    id="cur-rate"
                    type="number"
                    inputMode="decimal"
                    placeholder="Ej: 1200"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="h-12 flex-1 rounded-2xl"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">{baseCurrency?.code}</span>
                </div>
              </div>

              <Button onClick={handleAdd} disabled={!code.trim() || !symbol.trim() || !rate || Number(rate) <= 0} className="w-full h-12 rounded-2xl active-press">
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
            <Plus className="mr-2 h-6 w-6" /> Agregar moneda
          </Button>
        </div>
      )}

      {/* Confirmación de borrado */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar moneda?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.label}" dejará de estar disponible al registrar gastos.
              Solo puedes borrar monedas que no tengan gastos asociados.
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

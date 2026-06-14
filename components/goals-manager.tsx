"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import { formatCurrency } from "@/lib/expenses"
import { ArrowLeft, Plus, Trash2, X, PiggyBank, Minus } from "lucide-react"
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

const EMOJI_SUGGESTIONS = [
  "🎯", "🏠", "🚗", "✈️", "💍", "🎓", "💻", "📱", "🛋️", "🏖️",
  "👶", "🎉", "🏥", "🐶", "🎸", "📚",
]

interface GoalsManagerProps {
  onClose: () => void
}

export function GoalsManager({ onClose }: GoalsManagerProps) {
  const { goals, getBaseCurrency, addGoal, addContribution, deleteGoal } = useExpenses()
  const symbol = getBaseCurrency().symbol

  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newEmoji, setNewEmoji] = useState(EMOJI_SUGGESTIONS[0])
  const [newTarget, setNewTarget] = useState("")
  const [newDate, setNewDate] = useState("")

  const [contributingId, setContributingId] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

  const handleAdd = () => {
    const target = Number(newTarget)
    if (!newLabel.trim() || !target || target <= 0) return
    addGoal({
      label: newLabel.trim(),
      emoji: newEmoji,
      targetAmount: target,
      targetDate: newDate || null,
    })
    setNewLabel("")
    setNewTarget("")
    setNewDate("")
    setNewEmoji(EMOJI_SUGGESTIONS[0])
    setShowAddForm(false)
  }

  const handleStartContribution = (id: string) => {
    setContributingId(id)
    setContributionAmount("")
  }

  const handleContribute = (sign: 1 | -1) => {
    if (!contributingId) return
    const amount = Number(contributionAmount)
    if (!amount || amount <= 0) return
    addContribution(contributingId, amount * sign)
    setContributingId(null)
    setContributionAmount("")
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteGoal(deleteTarget.id)
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
        <h1 className="text-xl font-extrabold">Metas de ahorro</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        {goals.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 text-4xl">
              <PiggyBank className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No tenés metas de ahorro</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tocá el botón "+" para crear una</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {goals.map((goal, index) => {
            const percentage = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)
            const isComplete = goal.savedAmount >= goal.targetAmount
            const isContributing = contributingId === goal.id

            return (
              <div
                key={goal.id}
                className="flex flex-col gap-3 rounded-2xl surface-card p-4 animate-entrance"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
                    {goal.emoji}
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="font-medium truncate">{goal.label}</span>
                    {goal.targetDate && (
                      <span className="text-xs text-muted-foreground">
                        Meta para {new Date(goal.targetDate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ id: goal.id, label: goal.label })}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors active-press"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className={isComplete ? "text-success" : "text-foreground"}>
                      {formatCurrency(goal.savedAmount, symbol)} / {formatCurrency(goal.targetAmount, symbol)}
                    </span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {isContributing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Monto"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="h-10 flex-1 rounded-xl text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleContribute(-1)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted active-press"
                      title="Retirar"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleContribute(1)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active-press"
                      title="Agregar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setContributingId(null)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted active-press"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartContribution(goal.id)}
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-muted text-xs font-bold active-press"
                  >
                    <PiggyBank className="h-3.5 w-3.5" /> Registrar aporte
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Formulario para añadir */}
        {showAddForm && (
          <div className="animate-scale-in flex flex-col gap-4 rounded-3xl surface-card p-5 shadow-lg mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nueva meta</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-muted rounded-full active-press">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Nombre</Label>
                <Input
                  id="goal-name"
                  placeholder="Ej: Vacaciones"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewEmoji(emoji)}
                      className={`h-10 w-10 text-xl rounded-xl transition-all active-press ${newEmoji === emoji ? 'bg-primary scale-110 shadow-md' : 'bg-muted'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-target">Monto objetivo</Label>
                <Input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  placeholder="Ej: 500000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-date">Fecha objetivo (opcional)</Label>
                <Input
                  id="goal-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <Button onClick={handleAdd} disabled={!newLabel.trim() || !newTarget || Number(newTarget) <= 0} className="w-full h-12 rounded-2xl active-press">
                Guardar meta
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante inferior */}
      {!showAddForm && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={() => setShowAddForm(true)} size="lg" className="w-full h-14 text-lg rounded-2xl shadow-xl active-press">
            <Plus className="mr-2 h-6 w-6" /> Agregar meta
          </Button>
        </div>
      )}

      {/* Confirmación de borrado */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.label}" y su progreso se eliminarán permanentemente.
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

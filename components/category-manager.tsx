"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExpenses } from "@/context/expense-context"
import { ArrowLeft, Plus, Trash2, X } from "lucide-react"
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
  "💰", "🏦", "💳", "🎟️", "🎁", "📚", "🏀", "☕", "💻", "📱",
  "🎓", "🎨", "✈️", "🏠", "👕", "💡", "🛠️", "🚿", "📞", "🍽️",
  "🍰", "🍔", "🍕", "🍸", "🍷", "🎬", "🎵", "🎮", "❤️", "🐶",
  "🐱", "💧", "⚽", "💉", "💊",
]

const COLOR_OPTIONS = [
  "hsl(152, 60%, 45%)", "hsl(0, 70%, 55%)", "hsl(38, 92%, 50%)",
  "hsl(200, 70%, 50%)", "hsl(270, 55%, 55%)", "hsl(210, 60%, 50%)",
  "hsl(30, 90%, 55%)", "hsl(340, 65%, 50%)", "hsl(180, 50%, 40%)",
  "hsl(310, 55%, 50%)", "hsl(45, 80%, 55%)", "hsl(120, 40%, 45%)",
]

interface CategoryManagerProps {
  onClose: () => void
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, addCategory, deleteCategory, expenses } = useExpenses()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmoji, setNewEmoji] = useState("💰")
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleteError, setDeleteError] = useState(false)

  // Memorizamos el conteo para evitar cálculos innecesarios en cada render
  const categoryCounts = useMemo(() => {
    return expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [expenses])

  const handleAdd = () => {
    if (!newName.trim()) return
    addCategory({
      label: newName.trim(),
      emoji: newEmoji,
      color: newColor,
    })
    setNewName("")
    setShowAddForm(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const success = deleteCategory(deleteTarget.id)
    if (!success) setDeleteError(true)
    setDeleteTarget(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background animate-fade-in">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted active-press"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">Categorías</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        {/* Lista de categorías */}
        <div className="flex flex-col gap-2">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm animate-entrance"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                {cat.emoji}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{cat.label}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryCounts[cat.id] || 0} {categoryCounts[cat.id] === 1 ? "gasto" : "gastos"}
                </span>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: cat.id, label: cat.label })}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors active-press"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Formulario para añadir */}
        {showAddForm && (
          <div className="animate-scale-in flex flex-col gap-4 rounded-2xl bg-card p-5 border shadow-lg mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nueva categoría</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nombre</Label>
                <Input
                  id="cat-name"
                  placeholder="Ej: Mascotas"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12"
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
                      className={`h-10 w-10 text-xl rounded-lg transition-all ${newEmoji === emoji ? 'bg-primary scale-110 shadow-md' : 'bg-muted'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-3">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`h-8 w-8 rounded-full border-2 ${newColor === color ? 'border-primary scale-125' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleAdd} disabled={!newName.trim()} className="w-full h-12 active-press">
                Guardar categoría
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante inferior */}
      {!showAddForm && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={() => setShowAddForm(true)} size="lg" className="w-full h-14 text-lg shadow-xl active-press">
            <Plus className="mr-2 h-6 w-6" /> Agregar categoría
          </Button>
        </div>
      )}

      {/* Diálogos de Alerta */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              La categoría "{deleteTarget?.label}" se eliminará permanentemente. 
              Solo puedes borrar categorías que no tengan gastos registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="flex-1 bg-destructive text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteError} onOpenChange={() => setDeleteError(false)}>
        <AlertDialogContent className="rounded-2xl w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle>Acción denegada</AlertDialogTitle>
            <AlertDialogDescription>
              No puedes eliminar esta categoría porque tiene gastos asociados. 
              Borra o mueve esos gastos antes de intentar de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full">Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
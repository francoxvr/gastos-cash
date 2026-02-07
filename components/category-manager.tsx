"use client"

import React, { useState } from "react"
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
  "\u{1F4B0}", "\u{1F3E6}", "\u{1F4B3}", "\u{1F3AB}", "\u{1F381}",
  "\u{1F4DA}", "\u{1F3C0}", "\u{2615}", "\u{1F4BB}", "\u{1F4F1}",
  "\u{1F393}", "\u{1F3A8}", "\u{2708}", "\u{1F3E0}", "\u{1F455}",
  "\u{1F4A1}", "\u{1F527}", "\u{1F6BF}", "\u{1F4DE}", "\u{1F37D}",
  "\u{1F370}", "\u{1F354}", "\u{1F355}", "\u{1F378}", "\u{1F377}",
  "\u{1F3AC}", "\u{1F3B5}", "\u{1F3AE}", "\u{2764}", "\u{1F436}",
  "\u{1F431}", "\u{1F4A7}", "\u{26BD}", "\u{1F489}", "\u{1F48A}",
]

const COLOR_OPTIONS = [
  "hsl(152, 60%, 45%)",
  "hsl(0, 70%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(270, 55%, 55%)",
  "hsl(210, 60%, 50%)",
  "hsl(30, 90%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(180, 50%, 40%)",
  "hsl(310, 55%, 50%)",
  "hsl(45, 80%, 55%)",
  "hsl(120, 40%, 45%)",
]

interface CategoryManagerProps {
  onClose: () => void
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, addCategory, deleteCategory, expenses } = useExpenses()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmoji, setNewEmoji] = useState("\u{1F4B0}")
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleteError, setDeleteError] = useState(false)

  const handleAdd = () => {
    if (!newName.trim()) return
    addCategory({
      label: newName.trim(),
      emoji: newEmoji,
      color: newColor,
    })
    setNewName("")
    setNewEmoji("\u{1F4B0}")
    setNewColor(COLOR_OPTIONS[0])
    setShowAddForm(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const success = deleteCategory(deleteTarget.id)
    if (!success) {
      setDeleteError(true)
    }
    setDeleteTarget(null)
  }

  const getCategoryExpenseCount = (catId: string) => {
    return expenses.filter((e) => e.category === catId).length
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="animate-slide-down sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-all duration-200 hover:bg-muted active:scale-90"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-24">
        {/* Category list */}
        <div className="flex flex-col gap-2">
          {categories.map((cat, index) => {
            const count = getCategoryExpenseCount(cat.id)
            return (
              <div
                key={cat.id}
                className={`animate-slide-up stagger-${Math.min(index + 1, 10)} flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md`}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.emoji}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {count} {count === 1 ? "gasto" : "gastos"}
                  </span>
                </div>
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <button
                  onClick={() => setDeleteTarget({ id: cat.id, label: cat.label })}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-90"
                  aria-label={`Eliminar ${cat.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="animate-scale-in flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Nueva categoria</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-name" className="text-sm font-medium">Nombre</Label>
              <Input
                id="cat-name"
                placeholder="Ej: Mascotas"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
            </div>

            {/* Emoji picker */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Icono</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewEmoji(emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all duration-200 active:scale-90 ${
                      newEmoji === emoji
                        ? "bg-primary text-primary-foreground shadow-md scale-110"
                        : "bg-muted hover:bg-primary/10"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`h-10 w-10 rounded-full transition-all duration-200 active:scale-90 ${
                      newColor === color
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: `${newColor}20` }}
              >
                {newEmoji}
              </div>
              <span className="font-medium text-foreground">
                {newName || "Vista previa"}
              </span>
              <div
                className="ml-auto h-3 w-3 rounded-full"
                style={{ backgroundColor: newColor }}
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="h-12 w-full text-base font-semibold shadow-lg transition-all duration-200 active:scale-[0.97]"
            >
              Agregar categoria
            </Button>
          </div>
        )}
      </div>

      {/* Add button */}
      {!showAddForm && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 px-4 pb-6 pt-2 backdrop-blur-md">
          <Button
            onClick={() => setShowAddForm(true)}
            size="lg"
            className="h-14 w-full text-lg font-semibold shadow-lg transition-all duration-200 active:scale-[0.97]"
          >
            <Plus className="mr-2 h-6 w-6" />
            Agregar categoria
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="animate-scale-in mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la categoria &quot;{deleteTarget?.label}&quot;.
              Solo se puede eliminar si no tiene gastos asociados.
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

      {/* Error dialog */}
      <AlertDialog open={deleteError} onOpenChange={() => setDeleteError(false)}>
        <AlertDialogContent className="animate-scale-in mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>No se puede eliminar</AlertDialogTitle>
            <AlertDialogDescription>
              Esta categoria tiene gastos asociados. Elimina o reasigna los gastos primero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

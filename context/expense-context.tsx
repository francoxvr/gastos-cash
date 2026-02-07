"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
}

export interface Category {
  id: string
  label: string
  emoji: string
  color: string
}

interface ExpenseContextType {
  expenses: Expense[]
  categories: Category[]
  addExpense: (expense: Omit<Expense, "id">) => void
  deleteExpense: (id: string) => void
  // AGREGAMOS ESTA LÍNEA A LA INTERFAZ
  clearAllExpenses: () => Promise<void>
  getCategoryById: (id: string) => Category | undefined
  currentMonth: number
  currentYear: number
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

const INITIAL_CATEGORIES: Category[] = [
  { id: "verduleria", label: "Verdulería", emoji: "🥬", color: "hsl(var(--primary))" },
  { id: "carniceria", label: "Carnicería", emoji: "🥩", color: "hsl(var(--destructive))" },
  { id: "almacen", label: "Almacén", emoji: "🍞", color: "hsl(var(--chart-3))" },
  { id: "limpieza", label: "Limpieza", emoji: "🧹", color: "hsl(var(--chart-4))" },
  { id: "otros", label: "Otros", emoji: "📦", color: "hsl(var(--chart-5))" },
]

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const saved = localStorage.getItem("expenses")
    if (saved) {
      try { setExpenses(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses))
  }, [expenses])

  const getCategoryById = (id: string) => INITIAL_CATEGORIES.find(cat => cat.id === id)

  const addExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = { ...expenseData, id: Math.random().toString(36).substring(2, 9) }
    setExpenses((prev) => [newExpense, ...prev])
  }

  const deleteExpense = (id: string) => setExpenses((prev) => prev.filter((e) => e.id !== id))

  // AGREGAMOS LA FUNCIÓN DE BORRADO COMPLETO
  const clearAllExpenses = async () => {
    setExpenses([])
    localStorage.removeItem("expenses")
  }

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      categories: INITIAL_CATEGORIES, 
      addExpense, 
      deleteExpense, 
      clearAllExpenses, // LA PASAMOS AL PROVIDER
      getCategoryById, 
      currentMonth, 
      currentYear, 
      setCurrentMonth, 
      setCurrentYear 
    }}>
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpenses() {
  const context = useContext(ExpenseContext)
  if (!context) throw new Error("useExpenses must be used within ExpenseProvider")
  return context
}
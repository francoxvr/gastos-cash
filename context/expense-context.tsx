"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

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
  user_id?: string | null
}

interface ExpenseContextType {
  expenses: Expense[]
  categories: Category[]
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>
  updateExpense: (id: string, expense: Omit<Expense, "id">) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  clearAllExpenses: () => Promise<void>
  addCategory: (category: Omit<Category, "id">) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  getCategoryById: (id: string) => Category | undefined
  currentMonth: number
  currentYear: number
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
  loading: boolean
  refreshData: () => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Cargar Gastos y Categorías en paralelo para mayor velocidad
      const [expensesRes, categoriesRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .order('label', { ascending: true })
      ])

      if (expensesRes.data) setExpenses(expensesRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error sincronizando con Supabase:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setExpenses([])
      setCategories([])
      setLoading(false)
    }
  }, [user, loadData])

  const getCategoryById = (id: string) => categories.find(cat => cat.id === id)

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    if (!user) return
    // ID temporal para UI instantánea
    const tempId = crypto.randomUUID()
    const newExpense = { ...expenseData, id: tempId }
    
    setExpenses(prev => [newExpense, ...prev])

    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expenseData, user_id: user.id })
      .select().single()

    if (error) {
      setExpenses(prev => prev.filter(e => e.id !== tempId))
      alert("No se pudo guardar: " + error.message)
    } else if (data) {
      setExpenses(prev => prev.map(e => e.id === tempId ? data : e))
    }
  }

  const updateExpense = async (id: string, expenseData: Omit<Expense, "id">) => {
    const originalExpenses = [...expenses]
    setExpenses(prev => prev.map(e => e.id === id ? { ...expenseData, id } : e))

    const { error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)

    if (error) {
      setExpenses(originalExpenses)
      alert("Error al actualizar")
    }
  }

  const deleteExpense = async (id: string) => {
    const originalExpenses = [...expenses]
    setExpenses(prev => prev.filter(e => e.id !== id))

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      setExpenses(originalExpenses)
      alert("No se pudo eliminar")
    }
  }

  const addCategory = async (catData: Omit<Category, "id">) => {
    if (!user) return
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...catData, user_id: user.id })
      .select().single()

    if (data) setCategories(prev => [...prev, data])
    if (error) alert("Error al crear categoría")
  }

  const deleteCategory = async (id: string) => {
    const hasExpenses = expenses.some(e => e.category === id)
    if (hasExpenses) {
      alert("Esta categoría tiene gastos asociados y no puede borrarse.")
      return
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) loadData() // Re-sincronizar si falla
  }

  return (
    <ExpenseContext.Provider value={{ 
      expenses, categories, addExpense, updateExpense, deleteExpense, 
      addCategory, deleteCategory, getCategoryById, 
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      loading, refreshData: loadData, clearAllExpenses: async () => {} 
    }}>
      {children}
    </ExpenseContext.Provider>
  )
}

export const useExpenses = () => {
  const context = useContext(ExpenseContext)
  if (!context) throw new Error("useExpenses must be used within ExpenseProvider")
  return context
}
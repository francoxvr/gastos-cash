"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

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
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>
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
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  // Cargar gastos y categorías desde Supabase al iniciar
  useEffect(() => {
    loadExpenses()
    loadCategories()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Error cargando gastos:', error)
        return
      }

      if (data) {
        const mappedExpenses = data.map(expense => ({
          id: expense.id,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          description: expense.description || ''
        }))
        setExpenses(mappedExpenses)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error cargando categorías:', error)
        return
      }

      if (data) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getCategoryById = (id: string) => categories.find(cat => cat.id === id)

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          amount: expenseData.amount,
          category: expenseData.category,
          date: expenseData.date,
          description: expenseData.description
        })
        .select()
        .single()

      if (error) {
        console.error('Error agregando gasto:', error)
        alert('Error al agregar el gasto: ' + error.message)
        return
      }

      if (data) {
        const newExpense: Expense = {
          id: data.id,
          amount: data.amount,
          category: data.category,
          date: data.date,
          description: data.description || ''
        }
        setExpenses((prev) => [newExpense, ...prev])
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al agregar el gasto')
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando gasto:', error)
        return
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const clearAllExpenses = async () => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) {
        console.error('Error limpiando gastos:', error)
        return
      }

      setExpenses([])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const addCategory = async (categoryData: Omit<Category, "id">) => {
    try {
      // Generar un ID único basado en el label
      const id = categoryData.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: id,
          label: categoryData.label,
          emoji: categoryData.emoji,
          color: categoryData.color
        })
        .select()
        .single()

      if (error) {
        console.error('Error agregando categoría:', error)
        alert('Error al agregar la categoría: ' + error.message)
        return
      }

      if (data) {
        setCategories((prev) => [...prev, data])
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al agregar la categoría')
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      // Verificar si hay gastos con esta categoría
      const expensesWithCategory = expenses.filter(e => e.category === id)
      if (expensesWithCategory.length > 0) {
        alert(`No puedes eliminar esta categoría porque tiene ${expensesWithCategory.length} gasto(s) asociado(s)`)
        return
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando categoría:', error)
        return
      }

      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      categories,
      addExpense, 
      deleteExpense, 
      clearAllExpenses,
      addCategory,
      deleteCategory,
      getCategoryById, 
      currentMonth, 
      currentYear, 
      setCurrentMonth, 
      setCurrentYear,
      loading
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
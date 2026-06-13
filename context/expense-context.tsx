"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { DEFAULT_CATEGORIES } from "@/lib/seed-categories"

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
  budget?: number | null
}

interface ExpenseContextType {
  expenses: Expense[]
  categories: Category[]
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>
  updateExpense: (id: string, expense: Omit<Expense, "id">) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  clearAllExpenses: () => Promise<void>
  addCategory: (category: Omit<Category, "id">) => Promise<void>
  updateCategoryBudget: (id: string, budget: number | null) => Promise<void>
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
      const expensesRef = collection(db, 'users', user.uid, 'expenses')
      const categoriesRef = collection(db, 'users', user.uid, 'categories')

      const [expensesSnap, categoriesSnap] = await Promise.all([
        getDocs(query(expensesRef, orderBy('date', 'desc'))),
        getDocs(query(categoriesRef, orderBy('label', 'asc'))),
      ])

      setExpenses(expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)))

      if (categoriesSnap.empty) {
        // Primer ingreso: sembramos las categorías por defecto.
        // Se usa una transacción con un documento centinela para que,
        // si esto se dispara más de una vez (p. ej. doble efecto en
        // modo desarrollo), solo una siembra se aplique.
        const seedMarkerRef = doc(db, 'users', user.uid, 'meta', 'seed')
        await runTransaction(db, async (tx) => {
          const marker = await tx.get(seedMarkerRef)
          if (marker.exists()) return
          tx.set(seedMarkerRef, { seededAt: new Date().toISOString() })
          for (const cat of DEFAULT_CATEGORIES) {
            tx.set(doc(categoriesRef), cat)
          }
        })

        const seededSnap = await getDocs(query(categoriesRef, orderBy('label', 'asc')))
        setCategories(seededSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
      } else {
        setCategories(categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
      }
    } catch (error) {
      console.error('Error sincronizando con Firestore:', error)
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

    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'expenses'), expenseData)
      setExpenses(prev => prev.map(e => e.id === tempId ? { ...expenseData, id: ref.id } : e))
    } catch (error: any) {
      setExpenses(prev => prev.filter(e => e.id !== tempId))
      alert("No se pudo guardar: " + error.message)
    }
  }

  const updateExpense = async (id: string, expenseData: Omit<Expense, "id">) => {
    if (!user) return
    const originalExpenses = [...expenses]
    setExpenses(prev => prev.map(e => e.id === id ? { ...expenseData, id } : e))

    try {
      await updateDoc(doc(db, 'users', user.uid, 'expenses', id), expenseData)
    } catch {
      setExpenses(originalExpenses)
      alert("Error al actualizar")
    }
  }

  const deleteExpense = async (id: string) => {
    if (!user) return
    const originalExpenses = [...expenses]
    setExpenses(prev => prev.filter(e => e.id !== id))

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id))
    } catch {
      setExpenses(originalExpenses)
      alert("No se pudo eliminar")
    }
  }

  const addCategory = async (catData: Omit<Category, "id">) => {
    if (!user) return
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'categories'), catData)
      setCategories(prev => [...prev, { id: ref.id, ...catData }])
    } catch {
      alert("Error al crear categoría")
    }
  }

  const updateCategoryBudget = async (id: string, budget: number | null) => {
    if (!user) return
    const original = [...categories]
    setCategories(prev => prev.map(c => c.id === id ? { ...c, budget } : c))

    try {
      await updateDoc(doc(db, 'users', user.uid, 'categories', id), { budget })
    } catch {
      setCategories(original)
      alert("No se pudo actualizar el presupuesto")
    }
  }

  const deleteCategory = async (id: string) => {
    if (!user) return
    const hasExpenses = expenses.some(e => e.category === id)
    if (hasExpenses) {
      alert("Esta categoría tiene gastos asociados y no puede borrarse.")
      return
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'categories', id))
    } catch {
      loadData() // Re-sincronizar si falla
    }
  }

  return (
    <ExpenseContext.Provider value={{
      expenses, categories, addExpense, updateExpense, deleteExpense,
      addCategory, updateCategoryBudget, deleteCategory, getCategoryById,
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

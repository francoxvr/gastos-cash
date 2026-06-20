"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { DEFAULT_CATEGORIES } from "@/lib/seed-categories"
import { DEFAULT_CURRENCIES } from "@/lib/seed-currencies"

export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
  type?: "expense" | "income"
  currency?: string
  exchangeRate?: number
  paidBy?: string
}

export interface Category {
  id: string
  label: string
  emoji: string
  color: string
  budget?: number | null
}

export interface RecurringExpense {
  id: string
  amount: number
  category: string
  description: string
  dayOfMonth: number
  lastGeneratedMonth?: string // "YYYY-MM"
}

export interface Currency {
  id: string
  code: string
  symbol: string
  rateToBase: number // 1 unidad de esta moneda = rateToBase unidades de la moneda base
  isBase: boolean
}

export interface SavingsGoal {
  id: string
  label: string
  emoji: string
  targetAmount: number
  savedAmount: number
  targetDate?: string | null // "YYYY-MM-DD"
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
  recurringExpenses: RecurringExpense[]
  addRecurring: (recurring: Omit<RecurringExpense, "id" | "lastGeneratedMonth">) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
  confirmRecurring: (id: string) => Promise<void>
  skipRecurring: (id: string) => Promise<void>
  currencies: Currency[]
  getBaseCurrency: () => Currency
  getCurrencyByCode: (code?: string) => Currency
  addCurrency: (currency: Omit<Currency, "id" | "isBase">) => Promise<void>
  updateCurrencyRate: (id: string, rateToBase: number) => Promise<void>
  deleteCurrency: (id: string) => Promise<void>
  currentMonth: number
  currentYear: number
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
  loading: boolean
  refreshData: () => Promise<void>
  householdId: string
  isOwner: boolean
  members: string[]
  memberEmails: Record<string, string>
  inviteCode: string | null
  inviteEnabled: boolean
  generateInviteCode: () => Promise<void>
  disableSharing: () => Promise<void>
  removeMember: (uid: string) => Promise<void>
  joinHousehold: (code: string) => Promise<{ success: boolean; error?: string }>
  leaveHousehold: () => Promise<void>
  goals: SavingsGoal[]
  addGoal: (goal: Omit<SavingsGoal, "id" | "savedAmount">) => Promise<void>
  updateGoal: (id: string, updates: { label: string; emoji: string; targetAmount: number; targetDate?: string | null }) => Promise<void>
  addContribution: (id: string, amount: number) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [householdId, setHouseholdId] = useState<string>("")
  const [members, setMembers] = useState<string[]>([])
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({})
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteEnabled, setInviteEnabled] = useState(false)
  const [goals, setGoals] = useState<SavingsGoal[]>([])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Resolvemos el perfil del usuario para saber a qué "hogar" pertenece
      // (por defecto, el suyo propio: householdId === uid).
      const profileRef = doc(db, 'users', user.uid)
      const profileSnap = await getDoc(profileRef)
      let profile = profileSnap.data() as
        | { householdId?: string; members?: string[]; inviteCode?: string | null; inviteEnabled?: boolean; email?: string }
        | undefined

      if (!profileSnap.exists()) {
        profile = { householdId: user.uid, members: [user.uid], inviteCode: null, inviteEnabled: false, email: user.email || '' }
        await setDoc(profileRef, profile)
      } else if (profile?.email !== user.email) {
        await setDoc(profileRef, { email: user.email || '' }, { merge: true })
      }

      const activeHouseholdId = profile?.householdId || user.uid
      setHouseholdId(activeHouseholdId)

      // Si pertenecemos al "hogar" de otro usuario, leemos los datos de
      // compartición desde el perfil del dueño del hogar.
      let householdMembers = profile?.members || [user.uid]
      let householdInviteCode = profile?.inviteCode ?? null
      let householdInviteEnabled = profile?.inviteEnabled ?? false
      if (activeHouseholdId !== user.uid) {
        const ownerSnap = await getDoc(doc(db, 'users', activeHouseholdId))
        const ownerData = ownerSnap.data() as { members?: string[]; inviteCode?: string | null; inviteEnabled?: boolean } | undefined
        householdMembers = ownerData?.members || [activeHouseholdId]
        householdInviteCode = ownerData?.inviteCode ?? null
        householdInviteEnabled = ownerData?.inviteEnabled ?? false
      }
      setMembers(householdMembers)
      setInviteCode(householdInviteCode)
      setInviteEnabled(householdInviteEnabled)

      if (householdMembers.length > 1) {
        const emailEntries = await Promise.all(
          householdMembers.map(async (uid) => {
            if (uid === user.uid) return [uid, user.email || ''] as const
            const snap = await getDoc(doc(db, 'users', uid))
            return [uid, (snap.data()?.email as string) || ''] as const
          })
        )
        setMemberEmails(Object.fromEntries(emailEntries))
      } else {
        setMemberEmails({ [user.uid]: user.email || '' })
      }

      const expensesRef = collection(db, 'users', activeHouseholdId, 'expenses')
      const categoriesRef = collection(db, 'users', activeHouseholdId, 'categories')
      const recurringRef = collection(db, 'users', activeHouseholdId, 'recurring')
      const currenciesRef = collection(db, 'users', activeHouseholdId, 'currencies')
      const goalsRef = collection(db, 'users', activeHouseholdId, 'goals')

      const [expensesSnap, categoriesSnap, recurringSnap, currenciesSnap, goalsSnap] = await Promise.all([
        getDocs(query(expensesRef, orderBy('date', 'desc'))),
        getDocs(query(categoriesRef, orderBy('label', 'asc'))),
        getDocs(recurringRef),
        getDocs(currenciesRef),
        getDocs(goalsRef),
      ])

      setExpenses(expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)))
      setRecurringExpenses(recurringSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringExpense)))
      setGoals(goalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)))

      if (currenciesSnap.empty) {
        const seedMarkerRef = doc(db, 'users', activeHouseholdId, 'meta', 'seedCurrencies')
        await runTransaction(db, async (tx) => {
          const marker = await tx.get(seedMarkerRef)
          if (marker.exists()) return
          tx.set(seedMarkerRef, { seededAt: new Date().toISOString() })
          for (const cur of DEFAULT_CURRENCIES) {
            tx.set(doc(currenciesRef), cur)
          }
        })

        const seededSnap = await getDocs(currenciesRef)
        setCurrencies(seededSnap.docs.map(d => ({ id: d.id, ...d.data() } as Currency)))
      } else {
        setCurrencies(currenciesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Currency)))
      }

      if (categoriesSnap.empty) {
        // Primer ingreso: sembramos las categorías por defecto.
        // Se usa una transacción con un documento centinela para que,
        // si esto se dispara más de una vez (p. ej. doble efecto en
        // modo desarrollo), solo una siembra se aplique.
        const seedMarkerRef = doc(db, 'users', activeHouseholdId, 'meta', 'seed')
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
      setRecurringExpenses([])
      setCurrencies([])
      setHouseholdId("")
      setMembers([])
      setMemberEmails({})
      setInviteCode(null)
      setInviteEnabled(false)
      setGoals([])
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
      const ref = await addDoc(collection(db, 'users', householdId, 'expenses'), expenseData)
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
      await updateDoc(doc(db, 'users', householdId, 'expenses', id), expenseData)
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
      await deleteDoc(doc(db, 'users', householdId, 'expenses', id))
    } catch {
      setExpenses(originalExpenses)
      alert("No se pudo eliminar")
    }
  }

  const clearAllExpenses = async () => {
    if (!user) return
    const original = [...expenses]
    setExpenses([])

    try {
      const expensesRef = collection(db, 'users', householdId, 'expenses')
      const snap = await getDocs(expensesRef)
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
    } catch {
      setExpenses(original)
      alert("No se pudieron eliminar los gastos")
    }
  }

  const addCategory = async (catData: Omit<Category, "id">) => {
    if (!user) return
    try {
      const ref = await addDoc(collection(db, 'users', householdId, 'categories'), catData)
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
      await updateDoc(doc(db, 'users', householdId, 'categories', id), { budget })
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
      await deleteDoc(doc(db, 'users', householdId, 'categories', id))
    } catch {
      loadData() // Re-sincronizar si falla
    }
  }

  const addRecurring = async (recurringData: Omit<RecurringExpense, "id" | "lastGeneratedMonth">) => {
    if (!user) return
    try {
      const ref = await addDoc(collection(db, 'users', householdId, 'recurring'), recurringData)
      setRecurringExpenses(prev => [...prev, { id: ref.id, ...recurringData }])
    } catch {
      alert("Error al crear el gasto recurrente")
    }
  }

  const deleteRecurring = async (id: string) => {
    if (!user) return
    const original = [...recurringExpenses]
    setRecurringExpenses(prev => prev.filter(r => r.id !== id))

    try {
      await deleteDoc(doc(db, 'users', householdId, 'recurring', id))
    } catch {
      setRecurringExpenses(original)
      alert("No se pudo eliminar el gasto recurrente")
    }
  }

  const getCurrentMonthKey = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const confirmRecurring = async (id: string) => {
    if (!user) return
    const recurring = recurringExpenses.find(r => r.id === id)
    if (!recurring) return

    const monthKey = getCurrentMonthKey()
    await addExpense({
      amount: recurring.amount,
      category: recurring.category,
      date: new Date().toISOString().split('T')[0],
      description: recurring.description,
      type: "expense",
    })

    setRecurringExpenses(prev => prev.map(r => r.id === id ? { ...r, lastGeneratedMonth: monthKey } : r))
    try {
      await updateDoc(doc(db, 'users', householdId, 'recurring', id), { lastGeneratedMonth: monthKey })
    } catch {
      // El gasto ya se registró; reintentará marcarse como pendiente en la próxima carga
    }
  }

  const skipRecurring = async (id: string) => {
    if (!user) return
    const monthKey = getCurrentMonthKey()
    setRecurringExpenses(prev => prev.map(r => r.id === id ? { ...r, lastGeneratedMonth: monthKey } : r))
    try {
      await updateDoc(doc(db, 'users', householdId, 'recurring', id), { lastGeneratedMonth: monthKey })
    } catch {
      loadData()
    }
  }

  const getBaseCurrency = (): Currency => {
    return currencies.find(c => c.isBase) || { id: '', code: 'ARS', symbol: '$', rateToBase: 1, isBase: true }
  }

  const getCurrencyByCode = (code?: string): Currency => {
    return currencies.find(c => c.code === code) || getBaseCurrency()
  }

  const addCurrency = async (currencyData: Omit<Currency, "id" | "isBase">) => {
    if (!user) return
    try {
      const ref = await addDoc(collection(db, 'users', householdId, 'currencies'), { ...currencyData, isBase: false })
      setCurrencies(prev => [...prev, { id: ref.id, ...currencyData, isBase: false }])
    } catch {
      alert("Error al crear la moneda")
    }
  }

  const updateCurrencyRate = async (id: string, rateToBase: number) => {
    if (!user) return
    const original = [...currencies]
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, rateToBase } : c))

    try {
      await updateDoc(doc(db, 'users', householdId, 'currencies', id), { rateToBase })
    } catch {
      setCurrencies(original)
      alert("No se pudo actualizar la tasa de cambio")
    }
  }

  const deleteCurrency = async (id: string) => {
    if (!user) return
    const currency = currencies.find(c => c.id === id)
    if (!currency || currency.isBase) return

    const inUse = expenses.some(e => e.currency === currency.code)
    if (inUse) {
      alert("Esta moneda tiene gastos asociados y no puede borrarse.")
      return
    }

    const original = [...currencies]
    setCurrencies(prev => prev.filter(c => c.id !== id))
    try {
      await deleteDoc(doc(db, 'users', householdId, 'currencies', id))
    } catch {
      setCurrencies(original)
      alert("No se pudo eliminar la moneda")
    }
  }

  const isOwner = !!user && householdId === user.uid

  const generateInviteCode = async () => {
    if (!user || !isOwner) return
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    try {
      await setDoc(doc(db, 'invites', code), { householdId: user.uid })
      await updateDoc(doc(db, 'users', user.uid), { inviteCode: code, inviteEnabled: true })
      setInviteCode(code)
      setInviteEnabled(true)
    } catch {
      alert("No se pudo generar el código de invitación")
    }
  }

  const disableSharing = async () => {
    if (!user || !isOwner) return
    try {
      if (inviteCode) {
        await deleteDoc(doc(db, 'invites', inviteCode))
      }
      await updateDoc(doc(db, 'users', user.uid), { inviteEnabled: false })
      setInviteEnabled(false)
    } catch {
      alert("No se pudo desactivar la compartición")
    }
  }

  const removeMember = async (uid: string) => {
    if (!user || !isOwner || uid === user.uid) return
    const original = members
    setMembers(prev => prev.filter(m => m !== uid))
    try {
      await updateDoc(doc(db, 'users', user.uid), { members: arrayRemove(uid) })
    } catch {
      setMembers(original)
      alert("No se pudo quitar al integrante")
    }
  }

  const joinHousehold = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No autenticado" }
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return { success: false, error: "Ingresá un código" }
    try {
      const inviteSnap = await getDoc(doc(db, 'invites', trimmed))
      if (!inviteSnap.exists()) return { success: false, error: "Código inválido" }
      const targetHouseholdId = inviteSnap.data().householdId as string
      if (targetHouseholdId === user.uid) return { success: false, error: "No podés unirte a tu propia cuenta" }

      const ownerSnap = await getDoc(doc(db, 'users', targetHouseholdId))
      if (!ownerSnap.exists() || !ownerSnap.data()?.inviteEnabled) {
        return { success: false, error: "La compartición no está activa" }
      }

      await updateDoc(doc(db, 'users', targetHouseholdId), { members: arrayUnion(user.uid) })
      await updateDoc(doc(db, 'users', user.uid), { householdId: targetHouseholdId })
      await loadData()
      return { success: true }
    } catch {
      return { success: false, error: "No se pudo unir a la cuenta compartida" }
    }
  }

  const leaveHousehold = async () => {
    if (!user || isOwner) return
    try {
      await updateDoc(doc(db, 'users', householdId), { members: arrayRemove(user.uid) })
      await updateDoc(doc(db, 'users', user.uid), { householdId: user.uid })
      await loadData()
    } catch {
      alert("No se pudo salir de la cuenta compartida")
    }
  }

  const addGoal = async (goalData: Omit<SavingsGoal, "id" | "savedAmount">) => {
    if (!user) return
    try {
      const data = { ...goalData, savedAmount: 0 }
      const ref = await addDoc(collection(db, 'users', householdId, 'goals'), data)
      setGoals(prev => [...prev, { id: ref.id, ...data }])
    } catch {
      alert("Error al crear la meta")
    }
  }

  const updateGoal = async (id: string, updates: { label: string; emoji: string; targetAmount: number; targetDate?: string | null }) => {
    if (!user) return
    const original = [...goals]
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
    try {
      await updateDoc(doc(db, 'users', householdId, 'goals', id), updates)
    } catch {
      setGoals(original)
      alert("No se pudo actualizar la meta")
    }
  }

  const addContribution = async (id: string, amount: number) => {
    if (!user) return
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const savedAmount = Math.max(0, goal.savedAmount + amount)
    const original = [...goals]
    setGoals(prev => prev.map(g => g.id === id ? { ...g, savedAmount } : g))
    try {
      await updateDoc(doc(db, 'users', householdId, 'goals', id), { savedAmount })
    } catch {
      setGoals(original)
      alert("No se pudo registrar el aporte")
    }
  }

  const deleteGoal = async (id: string) => {
    if (!user) return
    const original = [...goals]
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteDoc(doc(db, 'users', householdId, 'goals', id))
    } catch {
      setGoals(original)
      alert("No se pudo eliminar la meta")
    }
  }

  return (
    <ExpenseContext.Provider value={{
      expenses, categories, addExpense, updateExpense, deleteExpense,
      addCategory, updateCategoryBudget, deleteCategory, getCategoryById,
      recurringExpenses, addRecurring, deleteRecurring, confirmRecurring, skipRecurring,
      currencies, getBaseCurrency, getCurrencyByCode, addCurrency, updateCurrencyRate, deleteCurrency,
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      loading, refreshData: loadData, clearAllExpenses,
      householdId, isOwner, members, memberEmails, inviteCode, inviteEnabled,
      generateInviteCode, disableSharing, removeMember, joinHousehold, leaveHousehold,
      goals, addGoal, updateGoal, addContribution, deleteGoal,
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

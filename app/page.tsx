"use client"

import { ExpenseProvider } from "@/context/expense-context"
import { ThemeProvider } from "@/context/theme-context"
import { ExpenseApp } from "@/components/expense-app"

// IMPORTANTE: El "export default" es lo que soluciona tu error
export default function Home() {
  return (
    <ThemeProvider>
      <ExpenseProvider>
        <main className="mx-auto max-w-md">
          <ExpenseApp />
        </main>
      </ExpenseProvider>
    </ThemeProvider>
  )
}
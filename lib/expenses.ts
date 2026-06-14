export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
  type?: "expense" | "income"
  currency?: string
  exchangeRate?: number
}

export function formatCurrency(amount: number, symbol = "$"): string {
  const sign = amount < 0 ? "-" : ""
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(amount)))
  return `${sign}${symbol} ${formatted}`
}

// Convierte el monto de un gasto a la moneda base usando la tasa de cambio
// guardada en el momento en que se registró (o 1 si está en la moneda base).
export function toBaseAmount(expense: Pick<Expense, "amount" | "exchangeRate">): number {
  return expense.amount * (expense.exchangeRate ?? 1)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T12:00:00")
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(date)
}

export function formatDateFull(dateString: string): string {
  const date = new Date(dateString + "T12:00:00")
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

// --- FUNCIÓN DE DESCARGA OPTIMIZADA ---
export function exportToCSV(expenses: Expense[], baseCode = "ARS") {
  const headers = ["Fecha", "Tipo", "Monto", "Moneda", `Monto en ${baseCode}`, "Categoria", "Descripcion"]
  const totalGastos = expenses.filter(e => e.type !== "income").reduce((sum, e) => sum + toBaseAmount(e), 0)
  const totalIngresos = expenses.filter(e => e.type === "income").reduce((sum, e) => sum + toBaseAmount(e), 0)

  // Usamos ";" para que Excel detecte las columnas correctamente
  const rows = expenses.map(e => `${e.date};${e.type === "income" ? "Ingreso" : "Gasto"};${e.amount};${e.currency || baseCode};${toBaseAmount(e)};${e.category};${e.description}`)

  const footerRow = ` ; ; ; ; ; ; `
  const totalGastosRow = `TOTAL GASTADO;;;;${totalGastos}; ; `
  const totalIngresosRow = `TOTAL INGRESOS;;;;${totalIngresos}; ; `
  const balanceRow = `BALANCE;;;;${totalIngresos - totalGastos}; ; `

  // IMPORTANTE: sep=; le indica a Excel explícitamente el separador
  const csvContent = [
    "sep=;",
    headers.join(";"),
    ...rows,
    footerRow,
    totalGastosRow,
    totalIngresosRow,
    balanceRow,
  ].join("\n")
  
  // Agregamos BOM (\ufeff) para asegurar compatibilidad con acentos en Windows
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  
  link.setAttribute("href", url)
  link.setAttribute("download", `Reporte_Gastos_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
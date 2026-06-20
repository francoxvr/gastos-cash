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

export function parseCSVImport(
  text: string,
  categories: { id: string; label: string }[]
): Omit<Expense, "id">[] {
  const sep = text.startsWith("sep=;") ? ";" : ","
  const lines = text.split(/\r?\n/).filter(Boolean)
  const results: Omit<Expense, "id">[] = []

  for (const line of lines) {
    if (line.startsWith("sep=") || line.startsWith("Fecha") || line.startsWith("TOTAL") || line.startsWith("BALANCE")) continue
    const cols = line.split(sep)
    if (cols.length < 3) continue

    const date = cols[0]?.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    const typeRaw = cols[1]?.trim().toLowerCase()
    const type: "expense" | "income" = typeRaw === "ingreso" ? "income" : "expense"
    const amount = parseFloat(cols[2]?.replace(",", ".") || "0")
    if (!amount || isNaN(amount)) continue

    const currency = cols[3]?.trim() || undefined
    const catRaw = cols[5]?.trim() || ""
    const description = (cols[6] || cols[3] || "").trim()
    const matched = categories.find(c => c.id === catRaw || c.label.toLowerCase() === catRaw.toLowerCase())
    const category = matched?.id || categories[0]?.id || ""

    results.push({ amount, category, date, description, type, currency: currency || undefined, exchangeRate: 1 })
  }

  return results
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

// Genera un PDF con el resumen del mes y el desglose por categoría
export async function exportMonthlyReportPDF(
  expenses: Expense[],
  categories: { id: string; label: string; budget?: number | null }[],
  month: number,
  year: number,
  symbol = "$"
) {
  const { jsPDF } = await import("jspdf")

  const periodExpenses = expenses.filter((e) => {
    const [y, m] = e.date.split("-").map(Number)
    return (m - 1) === month && y === year
  })

  const totalGastos = periodExpenses.filter((e) => e.type !== "income").reduce((sum, e) => sum + toBaseAmount(e), 0)
  const totalIngresos = periodExpenses.filter((e) => e.type === "income").reduce((sum, e) => sum + toBaseAmount(e), 0)
  const balance = totalIngresos - totalGastos

  const byCategory = categories
    .map((cat) => ({
      label: cat.label,
      amount: periodExpenses.filter((e) => e.type !== "income" && e.category === cat.id).reduce((sum, e) => sum + toBaseAmount(e), 0),
      budget: cat.budget || null,
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Gastos Cash", 14, y)
  y += 8

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Reporte de ${MONTH_NAMES[month]} ${year}`, 14, y)
  y += 12

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumen", 14, y)
  y += 7
  doc.setFont("helvetica", "normal")
  doc.text(`Gastado: ${formatCurrency(totalGastos, symbol)}`, 14, y)
  y += 6
  doc.text(`Ingresos: ${formatCurrency(totalIngresos, symbol)}`, 14, y)
  y += 6
  doc.text(`Balance: ${balance >= 0 ? "+" : ""}${formatCurrency(balance, symbol)}`, 14, y)
  y += 12

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Gastos por categoría", 14, y)
  y += 8

  doc.setFontSize(10)
  doc.text("Categoría", 14, y)
  doc.text("Monto", 120, y)
  doc.text("% del total", pageWidth - 14, y, { align: "right" })
  y += 2
  doc.line(14, y, pageWidth - 14, y)
  y += 6

  doc.setFont("helvetica", "normal")
  if (byCategory.length === 0) {
    doc.text("Sin gastos registrados en este período.", 14, y)
    y += 7
  }
  byCategory.forEach((cat) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    const pct = totalGastos > 0 ? Math.round((cat.amount / totalGastos) * 100) : 0
    doc.text(cat.label, 14, y)
    doc.text(formatCurrency(cat.amount, symbol), 120, y)
    doc.text(`${pct}%`, pageWidth - 14, y, { align: "right" })
    y += 7
    if (cat.budget) {
      doc.setFontSize(9)
      doc.setTextColor(130)
      doc.text(`Presupuesto: ${formatCurrency(cat.budget, symbol)}`, 14, y)
      doc.setFontSize(10)
      doc.setTextColor(0)
      y += 7
    }
  })

  doc.save(`gastos-cash-${MONTH_NAMES[month].toLowerCase()}-${year}.pdf`)
}
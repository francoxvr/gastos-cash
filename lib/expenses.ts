export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount)
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
export function exportToCSV(expenses: Expense[]) {
  const headers = ["Fecha", "Monto", "Categoria"]
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Usamos ";" para que Excel detecte las columnas correctamente
  const rows = expenses.map(e => `${e.date};$ ${e.amount};${e.category}`)
  
  const footerRow = ` ; ; `
  const totalRow = `TOTAL GASTADO;$ ${totalAmount}; `

  // IMPORTANTE: sep=; le indica a Excel explícitamente el separador
  const csvContent = [
    "sep=;", 
    headers.join(";"), 
    ...rows, 
    footerRow, 
    totalRow
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
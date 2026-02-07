export interface CategoryData {
  id: string
  label: string
  emoji: string
  color: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  date: string
}

export const defaultCategories: CategoryData[] = [
  { id: "verduleria", label: "Verduleria", emoji: "\u{1F96C}", color: "hsl(152, 60%, 45%)" },
  { id: "carniceria", label: "Carniceria", emoji: "\u{1F969}", color: "hsl(0, 70%, 55%)" },
  { id: "panaderia", label: "Panaderia", emoji: "\u{1F950}", color: "hsl(38, 92%, 50%)" },
  { id: "fiambreria", label: "Fiambreria", emoji: "\u{1F9C0}", color: "hsl(45, 80%, 55%)" },
  { id: "almacen", label: "Almacen / Kiosco", emoji: "\u{1F3EA}", color: "hsl(200, 70%, 50%)" },
  { id: "supermercado", label: "Supermercado", emoji: "\u{1F6D2}", color: "hsl(270, 55%, 55%)" },
  { id: "transporte", label: "Transporte", emoji: "\u{1F697}", color: "hsl(210, 60%, 50%)" },
  { id: "servicios", label: "Servicios", emoji: "\u{26A1}", color: "hsl(30, 90%, 55%)" },
  { id: "alquiler", label: "Alquiler", emoji: "\u{1F3E0}", color: "hsl(340, 65%, 50%)" },
  { id: "impuestos", label: "Impuestos", emoji: "\u{1F4C4}", color: "hsl(180, 50%, 40%)" },
  { id: "farmacia", label: "Farmacia / Salud", emoji: "\u{1F48A}", color: "hsl(310, 55%, 50%)" },
  { id: "otros", label: "Otros", emoji: "\u{1F4E6}", color: "hsl(220, 15%, 50%)" },
]

export const mockExpenses: Expense[] = [
  { id: "1", amount: 1250, category: "verduleria", date: "2026-02-05" },
  { id: "2", amount: 3200, category: "carniceria", date: "2026-02-05" },
  { id: "3", amount: 450, category: "panaderia", date: "2026-02-04" },
  { id: "4", amount: 1800, category: "supermercado", date: "2026-02-04" },
  { id: "5", amount: 890, category: "fiambreria", date: "2026-02-03" },
  { id: "6", amount: 320, category: "almacen", date: "2026-02-03" },
  { id: "7", amount: 1500, category: "transporte", date: "2026-02-02" },
  { id: "8", amount: 650, category: "verduleria", date: "2026-02-01" },
  { id: "9", amount: 2800, category: "servicios", date: "2026-02-01" },
  { id: "10", amount: 1100, category: "carniceria", date: "2026-02-01" },
  { id: "29", amount: 45000, category: "alquiler", date: "2026-02-01" },
  { id: "30", amount: 8500, category: "impuestos", date: "2026-02-03" },
  { id: "31", amount: 2200, category: "farmacia", date: "2026-02-04" },
]

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
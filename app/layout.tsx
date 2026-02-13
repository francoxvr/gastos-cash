import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"
import { ExpenseProvider } from "@/context/expense-context"
import { ThemeProvider } from "@/context/theme-context"

import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Gastos Cash",
  description: "Aplicación para control de gastos personales",
  themeColor: "#14b8a6",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gastos Cash",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" href="/icon-app-192.png" type="image/png" sizes="192x192" />
  <link rel="icon" href="/icon-app-512.png" type="image/png" sizes="512x512" />
  <link rel="apple-touch-icon" href="/icon-app-192.png" sizes="192x192" />
</head>

      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased transition-colors duration-300`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <ExpenseProvider>
              {children}
            </ExpenseProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
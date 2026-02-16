import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"
import { ExpenseProvider } from "@/context/expense-context"
import { ThemeProvider } from "@/context/theme-context"
import RegisterSW from "@/components/RegisterSW"

import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

// Configuración de la apariencia del navegador
export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
}

// Metadatos principales y configuración para dispositivos Apple
export const metadata: Metadata = {
  title: "Gastos Cash",
  description: "Aplicación para control de gastos personales",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gastos Cash",
  },
  icons: {
    apple: "/icon-192.png",
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
        {/* Favicons y acceso directo para móviles */}
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" sizes="192x192" />
        
        {/* Meta tags adicionales para iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
        
        {/* Registro del Service Worker para PWA */}
        <RegisterSW />
      </body>
    </html>
  )
}
import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Mis Gastos - Control de Gastos Personal',
  description: 'App para controlar y visualizar tus gastos personales',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased transition-colors duration-300`}
        suppressHydrationWarning // Clave para evitar errores de Playwright
      >
        {children}
      </body>
    </html>
  )
}
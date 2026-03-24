import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CasesProvider } from "@/contexts/cases-context"
import { AdminProvider } from "@/contexts/admin-context"
import { ContactsProvider } from "@/contexts/contacts-context"
import { UserProvider } from "@/contexts/user-context"
import { EmployeesProvider } from "@/contexts/employees-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <EmployeesProvider>
          <UserProvider>
            <AdminProvider>
              <CasesProvider>
                <ContactsProvider>{children}</ContactsProvider>
              </CasesProvider>
            </AdminProvider>
          </UserProvider>
        </EmployeesProvider>
        <Analytics />
      </body>
    </html>
  )
}

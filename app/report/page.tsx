"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  DollarSign
} from "lucide-react"
import Link from "next/link"

export default function ReportsDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Reports Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate and export reports for case management and payroll
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="p-2 rounded-lg bg-primary/10 w-fit">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg mt-3">Payroll Export</CardTitle>
              <CardDescription>Generate payroll data export for STD benefit payments</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="default" className="w-full" asChild>
                <Link href="/report/payroll-export">
                  Open Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

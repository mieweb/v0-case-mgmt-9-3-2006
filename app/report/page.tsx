"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Calendar,
  TrendingUp,
  ClipboardList,
  DollarSign
} from "lucide-react"
import Link from "next/link"

export default function ReportsDashboard() {
  const reports = [
    {
      id: "payroll-export",
      title: "Payroll Export",
      description: "Generate payroll data export for STD benefit payments",
      icon: DollarSign,
      href: "/report/payroll-export",
      category: "Financial"
    },
    {
      id: "case-summary",
      title: "Case Summary Report",
      description: "Overview of all cases by status, type, and case manager",
      icon: ClipboardList,
      href: "#",
      category: "Operations",
      comingSoon: true
    },
    {
      id: "caseload-analysis",
      title: "Caseload Analysis",
      description: "Case manager workload distribution and capacity metrics",
      icon: Users,
      href: "#",
      category: "Operations",
      comingSoon: true
    },
    {
      id: "aging-report",
      title: "Case Aging Report",
      description: "Track case duration and identify overdue items",
      icon: Calendar,
      href: "#",
      category: "Operations",
      comingSoon: true
    },
    {
      id: "benefit-trends",
      title: "Benefit Trends",
      description: "Analyze STD/LTD benefit utilization over time",
      icon: TrendingUp,
      href: "#",
      category: "Analytics",
      comingSoon: true
    },
    {
      id: "productivity-metrics",
      title: "Productivity Metrics",
      description: "Track case resolution times and team performance",
      icon: BarChart3,
      href: "#",
      category: "Analytics",
      comingSoon: true
    }
  ]

  const categories = ["Financial", "Operations", "Analytics"]

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
            Generate and export reports for case management, payroll, and analytics
          </p>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{category} Reports</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports
                .filter((report) => report.category === category)
                .map((report) => {
                  const Icon = report.icon
                  return (
                    <Card 
                      key={report.id} 
                      className={`transition-all hover:shadow-md ${
                        report.comingSoon 
                          ? "opacity-60 cursor-not-allowed" 
                          : "hover:border-primary/50 cursor-pointer"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          {report.comingSoon && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {report.comingSoon ? (
                          <Button variant="secondary" disabled className="w-full">
                            Not Available
                          </Button>
                        ) : (
                          <Button variant="default" className="w-full" asChild>
                            <Link href={report.href}>
                              Open Report
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

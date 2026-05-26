"use client"

import { useState, useMemo } from "react"
import { useCases, getCurrentJob } from "@/contexts/cases-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileSpreadsheet, Search, Filter, Download, ArrowLeft, ShieldAlert } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"

interface ReportRow {
  caseManager: string
  hourlySalary: string
  employeeNameNumber: string
  caseNumber: string
  caseType: string
  location: string
  restrictionDescription: string
  restrictionNotes: string
  isPermanent: string
  jobTitle: string
  costCenter: string
  costCenterDeptLineage: string
  reviewDate: string
  terminationDate: string
  dateOpened: string
}

export default function PermanentRestrictionsReport() {
  const { cases, restrictions } = useCases()
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [permanentFilter, setPermanentFilter] = useState("all")

  // Build report data by joining restrictions with cases
  const reportData = useMemo(() => {
    const rows: ReportRow[] = []

    restrictions.forEach(restriction => {
      const caseData = cases.find(c => c.caseNumber === restriction.caseNumber)
      if (!caseData) return

      // Get current job for job title
      const currentJob = getCurrentJob(caseData)

      // Parse date opened to get case opened date
      const caseNumberParts = caseData.caseNumber.split('-')
      const dateOpened = caseNumberParts.length > 0 
        ? `${caseNumberParts[0].slice(4, 6)}/${caseNumberParts[0].slice(6, 8)}/${caseNumberParts[0].slice(0, 4)}`
        : ""

      rows.push({
        caseManager: caseData.caseManager || "—",
        hourlySalary: caseData.hourlySalaryCode || "—",
        employeeNameNumber: `${caseData.employeeName} (${caseData.employeeNumber})`,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        location: caseData.employeeLocation || "—",
        restrictionDescription: restriction.restriction,
        restrictionNotes: restriction.notes || "—",
        isPermanent: restriction.isPermanent ? "Yes" : "No",
        jobTitle: currentJob?.jobTitle || caseData.jobTitle || "—",
        costCenter: caseData.costCenter || "—",
        costCenterDeptLineage: caseData.costCenterDeptLineage || "—",
        reviewDate: restriction.reviewDate || "—",
        terminationDate: caseData.terminationDate || "—",
        dateOpened: dateOpened || "—",
      })
    })

    return rows
  }, [cases, restrictions])

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = new Set(reportData.map(r => r.location))
    return Array.from(locs).filter(l => l !== "—").sort()
  }, [reportData])

  // Filter data
  const filteredData = useMemo(() => {
    return reportData.filter(row => {
      const matchesSearch = searchTerm === "" || 
        row.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.employeeNameNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.restrictionDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.caseManager.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLocation = locationFilter === "all" || row.location === locationFilter
      const matchesPermanent = permanentFilter === "all" || 
        (permanentFilter === "yes" && row.isPermanent === "Yes") ||
        (permanentFilter === "no" && row.isPermanent === "No")
      
      return matchesSearch && matchesLocation && matchesPermanent
    })
  }, [reportData, searchTerm, locationFilter, permanentFilter])

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredData.map(row => ({
      "Case Manager": row.caseManager,
      "Hourly or Salary": row.hourlySalary,
      "Employee Name And Number": row.employeeNameNumber,
      "Case Number": row.caseNumber,
      "Case Type": row.caseType,
      "Location": row.location,
      "Restriction Description": row.restrictionDescription,
      "Employee Restriction Notes": row.restrictionNotes,
      "Employee Restriction Permanent": row.isPermanent,
      "Employee Restriction Case Master Job Title Description": row.jobTitle,
      "Employee Restriction Case Master Cost Center Description": row.costCenter,
      "Employee Restriction Case Master Cost Center Department Lineage": row.costCenterDeptLineage,
      "Employee Restriction Review Date": row.reviewDate,
      "Employee Restriction Employee Date Of Termination": row.terminationDate,
      "Employee Restriction Case Master Date Opened": row.dateOpened,
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Permanent Restrictions")
    
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }))
    ws['!cols'] = colWidths
    
    XLSX.writeFile(wb, `permanent-restrictions-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Summary stats
  const totalRestrictions = filteredData.length
  const permanentCount = filteredData.filter(r => r.isPermanent === "Yes").length
  const uniqueCases = new Set(filteredData.map(r => r.caseNumber)).size

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/report">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Permanent Restrictions Report
          </h1>
          <p className="text-muted-foreground mt-2">
            View and export employee restriction data across all cases
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number, employee, restriction, or case manager..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={permanentFilter} onValueChange={setPermanentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Restrictions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restrictions</SelectItem>
                  <SelectItem value="yes">Permanent Only</SelectItem>
                  <SelectItem value="no">Temporary Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalRestrictions}</div>
              <p className="text-sm text-muted-foreground">Total Restrictions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{permanentCount}</div>
              <p className="text-sm text-muted-foreground">Permanent Restrictions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{uniqueCases}</div>
              <p className="text-sm text-muted-foreground">Unique Cases</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Report Data</CardTitle>
              <CardDescription>Showing {filteredData.length} records</CardDescription>
            </div>
            <Button onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Case Manager</TableHead>
                    <TableHead className="whitespace-nowrap">Hourly or Salary</TableHead>
                    <TableHead className="whitespace-nowrap">Employee Name & Number</TableHead>
                    <TableHead className="whitespace-nowrap">Case Number</TableHead>
                    <TableHead className="whitespace-nowrap">Case Type</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Restriction Description</TableHead>
                    <TableHead className="whitespace-nowrap">Restriction Notes</TableHead>
                    <TableHead className="whitespace-nowrap">Permanent</TableHead>
                    <TableHead className="whitespace-nowrap">Job Title</TableHead>
                    <TableHead className="whitespace-nowrap">Cost Center</TableHead>
                    <TableHead className="whitespace-nowrap">Dept Lineage</TableHead>
                    <TableHead className="whitespace-nowrap">Review Date</TableHead>
                    <TableHead className="whitespace-nowrap">Termination Date</TableHead>
                    <TableHead className="whitespace-nowrap">Date Opened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                        No restrictions found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.caseManager}</TableCell>
                        <TableCell>{row.hourlySalary}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.employeeNameNumber}</TableCell>
                        <TableCell className="font-mono">{row.caseNumber}</TableCell>
                        <TableCell>{row.caseType}</TableCell>
                        <TableCell>{row.location}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.restrictionDescription}>
                          {row.restrictionDescription}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={row.restrictionNotes}>
                          {row.restrictionNotes}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.isPermanent === "Yes" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {row.isPermanent}
                          </span>
                        </TableCell>
                        <TableCell>{row.jobTitle}</TableCell>
                        <TableCell>{row.costCenter}</TableCell>
                        <TableCell>{row.costCenterDeptLineage}</TableCell>
                        <TableCell>{row.reviewDate}</TableCell>
                        <TableCell>{row.terminationDate}</TableCell>
                        <TableCell>{row.dateOpened}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

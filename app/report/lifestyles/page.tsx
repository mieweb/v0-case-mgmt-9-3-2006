"use client"

import { useState, useMemo } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileSpreadsheet, ArrowLeft, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useCases } from "@/contexts/cases-context"

// Type for the flattened report row
type LifestylesReportRow = {
  caseNumber: string
  dateOpened: string
  diagnosisNumber: number
  medicalCodeDescription: string
  medicalCodeCode: string
  hourlyOrSalaryCode: string
  dateOfBirth: string
  age: number
  gender: string
  locationDescription: string
  actualReturnDate: string
  caseTypeDescription: string
  employeeNumber: string
  homeStateDescription: string
  mostRecentHireDate: string
  originalDateOfHire: string
  jobTitleDescription: string
  yearsOfEmployment: number
  dateOpenedToDateClosed: string
}

export default function LifestylesReport() {
  const { cases } = useCases()
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Calculate years of employment
  const calculateYearsOfEmployment = (hireDate: string): number => {
    if (!hireDate) return 0
    const hire = new Date(hireDate)
    const today = new Date()
    let years = today.getFullYear() - hire.getFullYear()
    const monthDiff = today.getMonth() - hire.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
      years--
    }
    return years
  }

  // Calculate days between two dates
  const calculateDaysBetween = (startDate: string, endDate: string | undefined): string => {
    if (!startDate) return "—"
    if (!endDate) return "Open"
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  // Format date to MM/DD/YYYY
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "—"
    // If already in MM/DD/YYYY format, return as-is
    if (dateStr.includes('/')) return dateStr
    // Convert from YYYY-MM-DD
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}/${year}`
  }

  // Extract state from location (e.g., "Toledo, OH" -> "OH")
  const extractState = (location: string): string => {
    if (!location) return "—"
    const parts = location.split(',')
    if (parts.length >= 2) {
      return parts[1].trim()
    }
    return "—"
  }

  // Generate flattened report data - one row per diagnosis
  const reportData = useMemo((): LifestylesReportRow[] => {
    const rows: LifestylesReportRow[] = []
    
    cases.forEach(caseItem => {
      const baseRow = {
        caseNumber: caseItem.caseNumber,
        dateOpened: formatDate(caseItem.created),
        hourlyOrSalaryCode: caseItem.employmentType === "Hourly" ? "Hourly" : caseItem.employmentType === "Salaried" ? "Salary" : "—",
        dateOfBirth: formatDate(caseItem.dateOfBirth),
        age: caseItem.age || calculateAge(caseItem.dateOfBirth || ""),
        gender: caseItem.gender || "—",
        locationDescription: caseItem.employeeLocation || "—",
        actualReturnDate: formatDate(caseItem.actualReturnDate || caseItem.returnToWorkDate),
        caseTypeDescription: caseItem.caseType || "—",
        employeeNumber: caseItem.employeeNumber || "—",
        homeStateDescription: extractState(caseItem.employeeLocation || ""),
        mostRecentHireDate: formatDate(caseItem.hireDate),
        originalDateOfHire: formatDate(caseItem.originalHireDate || caseItem.hireDate),
        jobTitleDescription: caseItem.jobTitle || "—",
        yearsOfEmployment: calculateYearsOfEmployment(caseItem.originalHireDate || caseItem.hireDate || ""),
        dateOpenedToDateClosed: calculateDaysBetween(caseItem.created || "", caseItem.dateClosed)
      }

      if (caseItem.diagnoses && caseItem.diagnoses.length > 0) {
        caseItem.diagnoses.forEach((diagnosis, index) => {
          rows.push({
            ...baseRow,
            diagnosisNumber: index + 1,
            medicalCodeDescription: diagnosis.icd10Description || "—",
            medicalCodeCode: diagnosis.icd10Code || "—",
          })
        })
      } else {
        // Include cases without diagnoses with empty diagnosis fields
        rows.push({
          ...baseRow,
          diagnosisNumber: 0,
          medicalCodeDescription: "No diagnosis recorded",
          medicalCodeCode: "—",
        })
      }
    })
    
    return rows
  }, [cases])

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = new Set(reportData.map(row => row.locationDescription))
    return Array.from(locs).filter(loc => loc !== "—").sort()
  }, [reportData])

  // Filter data
  const filteredData = useMemo(() => {
    return reportData.filter(row => {
      const matchesSearch = searchTerm === "" || 
        row.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.medicalCodeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.medicalCodeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLocation = locationFilter === "all" || row.locationDescription === locationFilter
      
      return matchesSearch && matchesLocation
    })
  }, [reportData, searchTerm, locationFilter])

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredData.map(row => ({
      "Employee Diagnosis Case Master Case No": row.caseNumber,
      "Employee Diagnosis Case Master Date Opened": row.dateOpened,
      "Employee Diagnosis Diagnoses No": row.diagnosisNumber,
      "Employee Diagnosis Medical Code Description": row.medicalCodeDescription,
      "Employee Diagnosis Medical Code Code": row.medicalCodeCode,
      "Employee Diagnosis Employee Hourly or Salary Code": row.hourlyOrSalaryCode,
      "Employee Diagnosis Employee Date Of Birth": row.dateOfBirth,
      "Employee Diagnosis Employee Age": row.age,
      "Employee Diagnosis Employee Gender": row.gender,
      "Employee Diagnosis Employee Location Description": row.locationDescription,
      "Employee Diagnosis Case Master Actual Return Date": row.actualReturnDate,
      "Employee Diagnosis Case Master Case Type Description": row.caseTypeDescription,
      "Employee Diagnosis Employee Employee Number": row.employeeNumber,
      "Employee Diagnosis Employee Home State Description": row.homeStateDescription,
      "Employee Diagnosis Employee Most Recent Hire Date": row.mostRecentHireDate,
      "Employee Diagnosis Employee Original Date of Hire": row.originalDateOfHire,
      "Employee Diagnosis Employee Job Title Description": row.jobTitleDescription,
      "Employee Diagnosis Employee Years Of Employment": row.yearsOfEmployment,
      "Employee Diagnosis Case Master Date Opened To Date Closed": row.dateOpenedToDateClosed
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Lifestyles Report")
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }))
    ws['!cols'] = colWidths
    
    XLSX.writeFile(wb, `lifestyles-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/report" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Reports
                </Link>
              </Button>
            </div>
            <Button onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Lifestyles Report
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive employee diagnosis and employment data report
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
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number, employee number, diagnosis code, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-[200px]">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredData.length}</div>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(filteredData.map(r => r.caseNumber)).size}
              </div>
              <p className="text-sm text-muted-foreground">Unique Cases</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredData.filter(r => r.diagnosisNumber > 0).length}
              </div>
              <p className="text-sm text-muted-foreground">Total Diagnoses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredData.filter(r => r.dateOpenedToDateClosed !== "Open").length}
              </div>
              <p className="text-sm text-muted-foreground">Closed Cases</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>Report Data</CardTitle>
            <CardDescription>
              Showing {filteredData.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Case No</TableHead>
                    <TableHead className="whitespace-nowrap">Date Opened</TableHead>
                    <TableHead className="whitespace-nowrap">Diagnosis No</TableHead>
                    <TableHead className="whitespace-nowrap">Medical Code Description</TableHead>
                    <TableHead className="whitespace-nowrap">Medical Code</TableHead>
                    <TableHead className="whitespace-nowrap">Hourly or Salary</TableHead>
                    <TableHead className="whitespace-nowrap">Date of Birth</TableHead>
                    <TableHead className="whitespace-nowrap">Age</TableHead>
                    <TableHead className="whitespace-nowrap">Gender</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Actual Return Date</TableHead>
                    <TableHead className="whitespace-nowrap">Case Type</TableHead>
                    <TableHead className="whitespace-nowrap">Employee Number</TableHead>
                    <TableHead className="whitespace-nowrap">Home State</TableHead>
                    <TableHead className="whitespace-nowrap">Most Recent Hire Date</TableHead>
                    <TableHead className="whitespace-nowrap">Original Hire Date</TableHead>
                    <TableHead className="whitespace-nowrap">Job Title</TableHead>
                    <TableHead className="whitespace-nowrap">Years of Employment</TableHead>
                    <TableHead className="whitespace-nowrap">Date Opened to Closed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={19} className="text-center py-8 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((row, index) => (
                      <TableRow key={`${row.caseNumber}-${row.diagnosisNumber}-${index}`}>
                        <TableCell className="font-medium">{row.caseNumber}</TableCell>
                        <TableCell>{row.dateOpened}</TableCell>
                        <TableCell>{row.diagnosisNumber || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.medicalCodeDescription}>
                          {row.medicalCodeDescription}
                        </TableCell>
                        <TableCell>{row.medicalCodeCode}</TableCell>
                        <TableCell>{row.hourlyOrSalaryCode}</TableCell>
                        <TableCell>{row.dateOfBirth}</TableCell>
                        <TableCell>{row.age || "—"}</TableCell>
                        <TableCell>{row.gender}</TableCell>
                        <TableCell>{row.locationDescription}</TableCell>
                        <TableCell>{row.actualReturnDate}</TableCell>
                        <TableCell>{row.caseTypeDescription}</TableCell>
                        <TableCell>{row.employeeNumber}</TableCell>
                        <TableCell>{row.homeStateDescription}</TableCell>
                        <TableCell>{row.mostRecentHireDate}</TableCell>
                        <TableCell>{row.originalDateOfHire}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={row.jobTitleDescription}>
                          {row.jobTitleDescription}
                        </TableCell>
                        <TableCell>{row.yearsOfEmployment}</TableCell>
                        <TableCell>{row.dateOpenedToDateClosed}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Download, FileSpreadsheet, Upload, Search, Plus, X, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useCases, Case } from "@/contexts/cases-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types
type EmployeeCase = {
  employeeName: string
  employeeId: string
  caseManager: string
  stdType: string
  location: string
  disabilityDate: string
  stdStartDate: string
  stdEndDate?: string
  ficaDate?: string
  totalStdDaysToPay: number
  hourlyRate: number
  rockfordTallmadgeIndicator?: "Pay 100" | "Pay 60"
  offsetReason?: string
  offsetAmount?: number
  offsetFrequency?: "weekly" | "monthly"
  partialReturnToWorkSupplement?: string
  comments?: string
}

type ProcessedCase = EmployeeCase & {
  date185: string
  stdPlan: string
  stdAmount: number
  normalizedOffset: number
  payThisPeriod: number
  errors: string[]
}

// STD Plan Mapping
const LOCATION_TO_PLAN: Record<string, string> = {
  Rockford: "100-60",
  Tallmadge: "100-60",
  "Kansas City": "KC",
  Delmar: "USW-IBEW-IAM",
  Fairburn: "USW-IBEW-IAM",
  Newark: "USW-IBEW-IAM",
  "Santa Clara": "USW-IBEW-IAM",
  Starr: "USW-IBEW-IAM",
  Waxahachie: "USW-IBEW-IAM",
}

// Sample Data
const sampleData: EmployeeCase[] = [
  {
    employeeName: "John Smith",
    employeeId: "12345",
    caseManager: "Sarah Jones",
    stdType: "New",
    location: "Rockford",
    disabilityDate: "2026-01-01",
    stdStartDate: "2026-01-08",
    stdEndDate: "2026-02-15",
    ficaDate: "2026-07-01",
    totalStdDaysToPay: 14,
    hourlyRate: 25,
    rockfordTallmadgeIndicator: "Pay 100",
    offsetReason: "Workers Comp",
    offsetAmount: 250,
    offsetFrequency: "weekly",
    comments: "Partial return expected",
  },
  {
    employeeName: "Jane Doe",
    employeeId: "67890",
    caseManager: "Mike Johnson",
    stdType: "Continuation",
    location: "Kansas City",
    disabilityDate: "2025-12-15",
    stdStartDate: "2025-12-22",
    stdEndDate: "2026-01-31",
    ficaDate: "2026-06-15",
    totalStdDaysToPay: 21,
    hourlyRate: 30,
    offsetAmount: 500,
    offsetFrequency: "monthly",
    comments: "Union member",
  },
  {
    employeeName: "Bob Williams",
    employeeId: "11111",
    caseManager: "Sarah Jones",
    stdType: "New",
    location: "Newark",
    disabilityDate: "2026-02-01",
    stdStartDate: "2026-02-08",
    totalStdDaysToPay: 7,
    hourlyRate: 22,
    ficaDate: "2026-08-01",
  },
  {
    employeeName: "Alice Brown",
    employeeId: "",
    caseManager: "Mike Johnson",
    stdType: "New",
    location: "Tallmadge",
    disabilityDate: "2026-01-15",
    stdStartDate: "2026-01-22",
    stdEndDate: "2026-02-28",
    totalStdDaysToPay: 10,
    hourlyRate: 28,
    comments: "Missing data for testing validation",
  },
]

// Calculation Functions
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

function getStdPlan(location: string): string {
  return LOCATION_TO_PLAN[location] || "Hourly 60%"
}

function calculateStdAmount(
  stdPlan: string,
  hourlyRate: number,
  totalDays: number,
  indicator?: "Pay 100" | "Pay 60"
): number {
  if (stdPlan === "USW-IBEW-IAM") {
    return Math.max((0.6 * 45 / 7) * hourlyRate * totalDays, (700 / 7) * totalDays)
  } else if (stdPlan === "Hourly 60%") {
    return (0.6 * 40 / 7) * hourlyRate * totalDays
  } else if (stdPlan === "KC") {
    return (0.6 * 45 / 7) * hourlyRate * totalDays
  } else if (stdPlan === "100-60" && indicator === "Pay 100") {
    return (40 / 7) * hourlyRate * totalDays
  } else {
    return (0.6 * 40 / 7) * hourlyRate * totalDays
  }
}

function calculateNormalizedOffset(
  offsetAmount: number | undefined,
  frequency: "weekly" | "monthly" | undefined,
  totalDays: number
): number {
  if (!offsetAmount) return 0
  if (frequency === "weekly") {
    return (offsetAmount / 7) * totalDays
  } else if (frequency === "monthly") {
    return offsetAmount * 12 / 52 * (totalDays / 7)
  }
  return 0
}

function validateCase(caseData: EmployeeCase, stdPlan: string): string[] {
  const errors: string[] = []

  if (!caseData.employeeId) {
    errors.push("Missing Employee ID")
  }

  if (stdPlan === "100-60" && !caseData.rockfordTallmadgeIndicator) {
    errors.push("Rockford/Tallmadge STD % Missing")
  }

  if (stdPlan === "KC" && !caseData.offsetAmount) {
    errors.push("KC Union disability offset missing")
  }

  if (caseData.offsetAmount && !caseData.offsetReason) {
    errors.push("Offset Reason not provided")
  }

  if (!caseData.disabilityDate) {
    errors.push("No Disability Date")
  }

  if (!caseData.ficaDate) {
    errors.push("Missing FICA Date")
  }

  if (caseData.offsetAmount && !caseData.offsetFrequency) {
    errors.push("Missing offset frequency")
  }

  return errors
}

function processCase(caseData: EmployeeCase): ProcessedCase {
  const stdPlan = getStdPlan(caseData.location)
  const date185 = caseData.disabilityDate ? addDays(caseData.disabilityDate, 185) : ""
  const stdAmount = calculateStdAmount(
    stdPlan,
    caseData.hourlyRate,
    caseData.totalStdDaysToPay,
    caseData.rockfordTallmadgeIndicator
  )
  const normalizedOffset = calculateNormalizedOffset(
    caseData.offsetAmount,
    caseData.offsetFrequency,
    caseData.totalStdDaysToPay
  )
  const payThisPeriod = Math.max(stdAmount - normalizedOffset, 0)
  const errors = validateCase(caseData, stdPlan)

  return {
    ...caseData,
    date185,
    stdPlan,
    stdAmount,
    normalizedOffset,
    payThisPeriod,
    errors,
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US")
}

export default function PayrollExportPage() {
  const [jsonInput, setJsonInput] = useState("")
  const [cases, setCases] = useState<ProcessedCase[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCaseNumbers, setSelectedCaseNumbers] = useState<Set<string>>(new Set())
  
  const { cases: systemCases } = useCases()
  
  // Filter for Short-term Disability cases only
  const stdCases = systemCases.filter(c => c.caseType === "Short-term Disability" && c.status === "Open")
  
  // Search filter
  const filteredStdCases = stdCases.filter(c => 
    c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Convert system case to EmployeeCase format
  const convertSystemCase = (systemCase: Case): EmployeeCase => {
    return {
      employeeName: systemCase.employeeName,
      employeeId: systemCase.employeeNumber,
      caseManager: systemCase.caseManager,
      stdType: "Continuation", // Could be derived from case history
      location: systemCase.employeeLocation.split(",")[0].trim(), // Extract city from "City, State"
      disabilityDate: systemCase.dateOfDisability || "",
      stdStartDate: systemCase.stdStartDate || systemCase.payStartDate || "",
      stdEndDate: systemCase.stdEndDate || systemCase.payEndDate,
      ficaDate: systemCase.ficaDate,
      totalStdDaysToPay: 7, // Default, should be calculated from dates
      hourlyRate: 25, // Default, would come from HRIS
      comments: `Case #${systemCase.caseNumber}`,
    }
  }
  
  const handleToggleCase = (caseNumber: string) => {
    const newSelected = new Set(selectedCaseNumbers)
    if (newSelected.has(caseNumber)) {
      newSelected.delete(caseNumber)
    } else {
      newSelected.add(caseNumber)
    }
    setSelectedCaseNumbers(newSelected)
  }
  
  const handleSelectAll = () => {
    if (selectedCaseNumbers.size === filteredStdCases.length) {
      setSelectedCaseNumbers(new Set())
    } else {
      setSelectedCaseNumbers(new Set(filteredStdCases.map(c => c.caseNumber)))
    }
  }
  
  const handleAddSelectedCases = () => {
    const selectedSystemCases = stdCases.filter(c => selectedCaseNumbers.has(c.caseNumber))
    const convertedCases = selectedSystemCases.map(convertSystemCase)
    const processed = convertedCases.map(processCase)
    setCases(prev => [...prev, ...processed])
    setSelectedCaseNumbers(new Set())
  }
  
  const handleRemoveCase = (index: number) => {
    setCases(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleClearAll = () => {
    setCases([])
  }

  const handleLoadSampleData = () => {
    setJsonInput(JSON.stringify(sampleData, null, 2))
    const processed = sampleData.map(processCase)
    setCases(processed)
    setParseError(null)
  }

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput) as EmployeeCase[]
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be an array of employee cases")
      }
      const processed = parsed.map(processCase)
      setCases(processed)
      setParseError(null)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON")
      setCases([])
    }
  }

  const generateXlsx = () => {
    if (cases.length === 0) return

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const wsData: (string | number | null)[][] = []

    // Add empty rows for title area
    wsData.push([]) // Row 1
    wsData.push([null, "MASTER Spreadsheet"]) // Row 2 - Title in B2
    wsData.push([]) // Row 3
    wsData.push([]) // Row 4
    wsData.push([]) // Row 5
    wsData.push([]) // Row 6

    // Headers (Row 7)
    const headers = [
      "Employee Name",
      "Employee ID",
      "Case Manager",
      "STD Type",
      "Location",
      "Date of Disability",
      "STD Start Date",
      "STD End Date",
      "185 days",
      "FICA Date",
      "Total Days of STD to be paid",
      "Hourly Rate",
      "STD Plan",
      "Rockford/Tallmadge Indicator",
      "STD Amount",
      "Offset Reason",
      "Offset Amount",
      "Offset Frequency",
      "Normalized Offset Amount",
      "STD Earnings to pay this Pay Period",
      "Partial Return to Work/Supplement",
      "Comments",
      "Errors/warnings",
    ]
    wsData.push(headers)

    // Data rows (starting Row 8)
    cases.forEach((c) => {
      wsData.push([
        c.employeeName,
        c.employeeId,
        c.caseManager,
        c.stdType,
        c.location,
        c.disabilityDate,
        c.stdStartDate,
        c.stdEndDate || "",
        c.date185,
        c.ficaDate || "",
        c.totalStdDaysToPay,
        c.hourlyRate,
        c.stdPlan,
        c.rockfordTallmadgeIndicator || "",
        c.stdAmount,
        c.offsetReason || "",
        c.offsetAmount || "",
        c.offsetFrequency || "",
        c.normalizedOffset,
        c.payThisPeriod,
        c.partialReturnToWorkSupplement || "",
        c.comments || "",
        c.errors.join("; "),
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Employee Name
      { wch: 12 }, // Employee ID
      { wch: 18 }, // Case Manager
      { wch: 12 }, // STD Type
      { wch: 15 }, // Location
      { wch: 15 }, // Date of Disability
      { wch: 15 }, // STD Start Date
      { wch: 15 }, // STD End Date
      { wch: 12 }, // 185 days
      { wch: 12 }, // FICA Date
      { wch: 12 }, // Total Days
      { wch: 12 }, // Hourly Rate
      { wch: 15 }, // STD Plan
      { wch: 22 }, // Rockford/Tallmadge
      { wch: 15 }, // STD Amount
      { wch: 18 }, // Offset Reason
      { wch: 15 }, // Offset Amount
      { wch: 15 }, // Offset Frequency
      { wch: 20 }, // Normalized Offset
      { wch: 25 }, // STD Earnings
      { wch: 25 }, // Partial Return
      { wch: 30 }, // Comments
      { wch: 35 }, // Errors
    ]
    ws["!cols"] = colWidths

    // Freeze panes at row 7
    ws["!freeze"] = { xSplit: 0, ySplit: 7 }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")

    // Generate and download file
    XLSX.writeFile(wb, "STD_Payroll_Export.xlsx")
  }

  const totalErrors = cases.reduce((sum, c) => sum + c.errors.length, 0)
  const totalPay = cases.reduce((sum, c) => sum + c.payThisPeriod, 0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1600px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">STD Payroll Export</h1>
        <p className="text-muted-foreground mt-2">
          Import employee STD case records and generate a formatted Excel payroll spreadsheet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Input Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Add Cases
            </CardTitle>
            <CardDescription>Select cases from the system or import JSON data</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lookup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lookup">System Lookup</TabsTrigger>
                <TabsTrigger value="json">JSON Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lookup" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search STD cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {filteredStdCases.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 p-2 border-b bg-muted/50 sticky top-0">
                        <Checkbox 
                          checked={selectedCaseNumbers.size === filteredStdCases.length && filteredStdCases.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm font-medium">Select All ({filteredStdCases.length})</span>
                      </div>
                      {filteredStdCases.map((c) => (
                        <div 
                          key={c.caseNumber} 
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleToggleCase(c.caseNumber)}
                        >
                          <Checkbox 
                            checked={selectedCaseNumbers.has(c.caseNumber)}
                            onCheckedChange={() => handleToggleCase(c.caseNumber)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.caseNumber} • {c.employeeLocation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {searchTerm ? "No matching STD cases found" : "No open STD cases in system"}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleAddSelectedCases} 
                  disabled={selectedCaseNumbers.size === 0}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add {selectedCaseNumbers.size} Selected Case{selectedCaseNumbers.size !== 1 ? "s" : ""}
                </Button>
              </TabsContent>
              
              <TabsContent value="json" className="space-y-4 mt-4">
                <Textarea
                  placeholder='[{"employeeName": "John Smith", ...}]'
                  className="font-mono text-sm h-48"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleLoadSampleData} className="flex-1">
                    Load Sample
                  </Button>
                  <Button onClick={handleParseJson} className="flex-1">
                    Parse JSON
                  </Button>
                </div>
                {parseError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{parseError}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export Summary
            </CardTitle>
            <CardDescription>Review calculated values before export</CardDescription>
          </CardHeader>
          <CardContent>
            {cases.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Cases</p>
                    <p className="text-2xl font-bold">{cases.length}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Days</p>
                    <p className="text-2xl font-bold">
                      {cases.reduce((sum, c) => sum + c.totalStdDaysToPay, 0)}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Pay</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPay)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Validation Errors</p>
                    <p className={`text-2xl font-bold ${totalErrors > 0 ? "text-red-600" : "text-green-600"}`}>
                      {totalErrors}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateXlsx} size="lg" className="flex-1">
                    <Download className="mr-2 h-5 w-5" />
                    Download Excel File
                  </Button>
                  <Button onClick={handleClearAll} size="lg" variant="outline">
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No data loaded. Paste JSON or load sample data to preview.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Review all calculated fields and validation errors before exporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Employee Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>STD Plan</TableHead>
                    <TableHead>Disability Date</TableHead>
                    <TableHead>185 Days</TableHead>
                    <TableHead className="text-right">Days to Pay</TableHead>
                    <TableHead className="text-right">Hourly Rate</TableHead>
                    <TableHead className="text-right">STD Amount</TableHead>
                    <TableHead className="text-right">Offset</TableHead>
                    <TableHead className="text-right">Pay This Period</TableHead>
                    <TableHead className="min-w-[200px]">Errors</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c, idx) => (
                    <TableRow key={idx} className={c.errors.length > 0 ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell className="font-medium">{c.employeeName}</TableCell>
                      <TableCell>{c.employeeId || <span className="text-red-500">Missing</span>}</TableCell>
                      <TableCell>{c.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.stdPlan}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(c.disabilityDate)}</TableCell>
                      <TableCell>{formatDate(c.date185)}</TableCell>
                      <TableCell className="text-right">{c.totalStdDaysToPay}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.hourlyRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.stdAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.normalizedOffset)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(c.payThisPeriod)}
                      </TableCell>
                      <TableCell>
                        {c.errors.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.errors.map((err, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {err}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Valid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveCase(idx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

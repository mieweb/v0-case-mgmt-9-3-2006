"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { useCases } from "@/contexts/cases-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Download,
  Search,
  Filter
} from "lucide-react"

interface AbsenceReportRow {
  caseNumber: string
  location: string
  absenceStartDate: string
  absenceStatusType: string
  absenceReasonDescription: string
  absenceNotes: string
  caseStatus: string
  statusDescription: string
}

export default function AbsenceReasonCodeOtherReport() {
  const { cases } = useCases()
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Get status type description
  const getStatusTypeDescription = (statusType: string): string => {
    const descriptions: Record<string, string> = {
      "FD": "First Day",
      "LWD": "Last Work Day",
      "RWD": "Return to Work Date",
      "RWDREGULARJOB": "Return to Work Date - Regular Job",
      "OTH": "Other"
    }
    return descriptions[statusType] || statusType
  }

  // Transform cases data into report rows - only include absences with "OTH" status type
  const reportData = useMemo(() => {
    const rows: AbsenceReportRow[] = []
    
    cases.forEach(caseItem => {
      if (caseItem.absences && caseItem.absences.length > 0) {
        caseItem.absences.forEach(absence => {
          // Only include absences with "OTH" (Other) status type
          if (absence.statusType === "OTH") {
            rows.push({
              caseNumber: caseItem.caseNumber,
              location: caseItem.employeeLocation || "—",
              absenceStartDate: absence.effectiveDate || "—",
              absenceStatusType: absence.statusType,
              absenceReasonDescription: absence.customOthName || "Other",
              absenceNotes: absence.status || "—",
              caseStatus: caseItem.status,
              statusDescription: getStatusTypeDescription(absence.statusType)
            })
          }
        })
      }
    })
    
    return rows
  }, [cases])

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    reportData.forEach(row => {
      if (row.location && row.location !== "—") {
        locations.add(row.location)
      }
    })
    return Array.from(locations).sort()
  }, [reportData])

  // Get unique case statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    reportData.forEach(row => {
      if (row.caseStatus) {
        statuses.add(row.caseStatus)
      }
    })
    return Array.from(statuses).sort()
  }, [reportData])

  // Filter data
  const filteredData = useMemo(() => {
    return reportData.filter(row => {
      const matchesSearch = searchTerm === "" || 
        row.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.absenceReasonDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.absenceNotes.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLocation = locationFilter === "all" || row.location === locationFilter
      const matchesStatus = statusFilter === "all" || row.caseStatus === statusFilter
      
      return matchesSearch && matchesLocation && matchesStatus
    })
  }, [reportData, searchTerm, locationFilter, statusFilter])

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredData.map(row => ({
      "Case Number": row.caseNumber,
      "Location": row.location,
      "Absence Start Date": row.absenceStartDate,
      "Absence Status Type": row.absenceStatusType,
      "Absence Reason Description": row.absenceReasonDescription,
      "Absence Notes": row.absenceNotes,
      "Case Status": row.caseStatus,
      "Status Description": row.statusDescription
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Absence Reason Code Other")
    
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }))
    ws['!cols'] = colWidths
    
    XLSX.writeFile(wb, `absence-reason-code-other-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/report">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Absence Reason Code - Other
          </h1>
          <p className="text-muted-foreground mt-2">
            View absences with &quot;Other&quot; reason code across all cases
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number, reason, or notes..."
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
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                {new Set(filteredData.map(r => r.location)).size}
              </div>
              <p className="text-sm text-muted-foreground">Locations</p>
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
                    <TableHead className="whitespace-nowrap">Case Number</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Absence Start Date</TableHead>
                    <TableHead className="whitespace-nowrap">Absence Status Type</TableHead>
                    <TableHead className="whitespace-nowrap">Absence Reason Description</TableHead>
                    <TableHead className="whitespace-nowrap">Absence Notes</TableHead>
                    <TableHead className="whitespace-nowrap">Case Status</TableHead>
                    <TableHead className="whitespace-nowrap">Status Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No absences with &quot;Other&quot; reason code found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((row, index) => (
                      <TableRow key={`${row.caseNumber}-${index}`}>
                        <TableCell className="font-medium">{row.caseNumber}</TableCell>
                        <TableCell>{row.location}</TableCell>
                        <TableCell>{row.absenceStartDate}</TableCell>
                        <TableCell>{row.absenceStatusType}</TableCell>
                        <TableCell>{row.absenceReasonDescription}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.absenceNotes}</TableCell>
                        <TableCell>{row.caseStatus}</TableCell>
                        <TableCell>{row.statusDescription}</TableCell>
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

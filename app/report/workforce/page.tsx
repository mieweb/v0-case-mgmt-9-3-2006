"use client"

import React, { useState, useMemo } from 'react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, ArrowLeft, Building2 } from "lucide-react"
import ExcelJS from 'exceljs'
import { useCases, getCurrentPay } from "@/contexts/cases-context"

interface LocationData {
  state: string
  location: string
  hourlyActive: number
  hourlyFurlough: number
  hourlyPaidLeave: number
  hourlySuspended: number
  hourlyUnpaidLeave: number
  hrlyLegacy: number
  hrlyDoors: number
  salariedActive: number
  salariedPaidLeave: number
  salariedUnpaidLeave: number
  salLegacy: number
  salDoors: number
  totalLegacy: number
  totalDoors: number
}

// Helper to extract state from location string like "Toledo, OH" -> "Ohio"
const stateAbbreviations: Record<string, string> = {
  'OH': 'Ohio',
  'KS': 'Kansas',
  'CA': 'California',
  'TX': 'Texas',
  'NY': 'New York',
  'FL': 'Florida',
  'IL': 'Illinois',
  'PA': 'Pennsylvania',
  'MI': 'Michigan',
  'GA': 'Georgia',
  'NC': 'North Carolina',
  'NJ': 'New Jersey',
  'VA': 'Virginia',
  'WA': 'Washington',
  'AZ': 'Arizona',
  'MA': 'Massachusetts',
  'TN': 'Tennessee',
  'IN': 'Indiana',
  'MO': 'Missouri',
  'MD': 'Maryland',
  'WI': 'Wisconsin',
  'CO': 'Colorado',
  'MN': 'Minnesota',
  'SC': 'South Carolina',
  'AL': 'Alabama',
  'LA': 'Louisiana',
  'KY': 'Kentucky',
  'OR': 'Oregon',
  'OK': 'Oklahoma',
  'CT': 'Connecticut',
  'UT': 'Utah',
  'IA': 'Iowa',
  'NV': 'Nevada',
  'AR': 'Arkansas',
  'MS': 'Mississippi',
  'NE': 'Nebraska',
  'NM': 'New Mexico',
  'WV': 'West Virginia',
  'ID': 'Idaho',
  'HI': 'Hawaii',
  'NH': 'New Hampshire',
  'ME': 'Maine',
  'MT': 'Montana',
  'RI': 'Rhode Island',
  'DE': 'Delaware',
  'SD': 'South Dakota',
  'ND': 'North Dakota',
  'AK': 'Alaska',
  'VT': 'Vermont',
  'WY': 'Wyoming',
  'DC': 'District of Columbia',
}

function getStateFromLocation(location: string): string {
  // Try to extract state abbreviation from "City, ST" format
  const parts = location.split(',')
  if (parts.length >= 2) {
    const stateAbbr = parts[parts.length - 1].trim()
    return stateAbbreviations[stateAbbr] || stateAbbr
  }
  return location
}

export default function WorkforceDashboard() {
  const { cases } = useCases()
  const [searchTerm, setSearchTerm] = useState('')

  // Aggregate case data into location-based workforce data
  const workforceData: LocationData[] = useMemo(() => {
    const locationMap = new Map<string, LocationData>()

    cases.forEach(caseItem => {
      const location = caseItem.employeeLocation || 'Unknown'
      const state = getStateFromLocation(location)
      
      // Determine if hourly or salaried from compensation history
      const currentPay = getCurrentPay(caseItem)
      const isHourly = currentPay?.unit === 'hourly'
      
      // Get or create location entry
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          state,
          location,
          hourlyActive: 0,
          hourlyFurlough: 0,
          hourlyPaidLeave: 0,
          hourlySuspended: 0,
          hourlyUnpaidLeave: 0,
          hrlyLegacy: 0,
          hrlyDoors: 0,
          salariedActive: 0,
          salariedPaidLeave: 0,
          salariedUnpaidLeave: 0,
          salLegacy: 0,
          salDoors: 0,
          totalLegacy: 0,
          totalDoors: 0,
        })
      }
      
      const locData = locationMap.get(location)!
      
      // Determine status category based on case status and absence data
      const status = caseItem.status?.toLowerCase() || ''
      const hasAbsence = caseItem.absences && caseItem.absences.length > 0
      const latestAbsence = hasAbsence ? caseItem.absences[caseItem.absences.length - 1] : null
      const absenceType = latestAbsence?.type?.toLowerCase() || ''
      
      // Categorize into the appropriate bucket
      if (isHourly) {
        if (status === 'closed' || status === 'furlough') {
          locData.hourlyFurlough++
        } else if (absenceType.includes('paid') || absenceType === 'continuous') {
          locData.hourlyPaidLeave++
        } else if (absenceType.includes('unpaid') || absenceType === 'intermittent') {
          locData.hourlyUnpaidLeave++
        } else if (status === 'suspended') {
          locData.hourlySuspended++
        } else {
          locData.hourlyActive++
        }
        // Legacy = sum of all hourly statuses, Doors = active only
        locData.hrlyLegacy = locData.hourlyActive + locData.hourlyFurlough + locData.hourlyPaidLeave + locData.hourlySuspended + locData.hourlyUnpaidLeave
        locData.hrlyDoors = locData.hourlyActive
      } else {
        // Salaried
        if (absenceType.includes('paid') || absenceType === 'continuous') {
          locData.salariedPaidLeave++
        } else if (absenceType.includes('unpaid') || absenceType === 'intermittent') {
          locData.salariedUnpaidLeave++
        } else {
          locData.salariedActive++
        }
        // Legacy = sum of all salaried statuses, Doors = active only
        locData.salLegacy = locData.salariedActive + locData.salariedPaidLeave + locData.salariedUnpaidLeave
        locData.salDoors = locData.salariedActive
      }
      
      // Update totals
      locData.totalLegacy = locData.hrlyLegacy + locData.salLegacy
      locData.totalDoors = locData.hrlyDoors + locData.salDoors
    })

    // Convert to array and sort by state then location
    return Array.from(locationMap.values()).sort((a, b) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state)
      return a.location.localeCompare(b.location)
    })
  }, [cases])

  const filteredData = workforceData.filter(row => 
    row.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group data by state
  const groupedData = useMemo(() => {
    const groups: Record<string, LocationData[]> = {}
    filteredData.forEach(row => {
      if (!groups[row.state]) {
        groups[row.state] = []
      }
      groups[row.state].push(row)
    })
    return groups
  }, [filteredData])

  // Calculate totals
  const totals = filteredData.reduce((acc, row) => ({
    hourlyActive: acc.hourlyActive + row.hourlyActive,
    hourlyFurlough: acc.hourlyFurlough + row.hourlyFurlough,
    hourlyPaidLeave: acc.hourlyPaidLeave + row.hourlyPaidLeave,
    hourlySuspended: acc.hourlySuspended + row.hourlySuspended,
    hourlyUnpaidLeave: acc.hourlyUnpaidLeave + row.hourlyUnpaidLeave,
    hrlyLegacy: acc.hrlyLegacy + row.hrlyLegacy,
    hrlyDoors: acc.hrlyDoors + row.hrlyDoors,
    salariedActive: acc.salariedActive + row.salariedActive,
    salariedPaidLeave: acc.salariedPaidLeave + row.salariedPaidLeave,
    salariedUnpaidLeave: acc.salariedUnpaidLeave + row.salariedUnpaidLeave,
    salLegacy: acc.salLegacy + row.salLegacy,
    salDoors: acc.salDoors + row.salDoors,
    totalLegacy: acc.totalLegacy + row.totalLegacy,
    totalDoors: acc.totalDoors + row.totalDoors,
  }), { 
    hourlyActive: 0, hourlyFurlough: 0, hourlyPaidLeave: 0, hourlySuspended: 0, 
    hourlyUnpaidLeave: 0, hrlyLegacy: 0, hrlyDoors: 0, salariedActive: 0, 
    salariedPaidLeave: 0, salariedUnpaidLeave: 0, salLegacy: 0, salDoors: 0,
    totalLegacy: 0, totalDoors: 0
  })

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Workforce Report')

    // Title Row
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    
    // Colors matching screenshot
    const blueHeaderFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'B8CCE4' } }
    const blueDataFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'B8CCE4' } }
    const purpleFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'CDA0CD' } }
    
    // Row 1: Export date
    worksheet.addRow([`Exported to Excel on ${dateStr}`])
    worksheet.mergeCells('A1:P1')
    worksheet.getRow(1).font = { italic: true }
    
    // Row 2: Empty
    worksheet.addRow([])
    
    // Row 3: Empty (dotted line separator in screenshot)
    worksheet.addRow([])
    
    // Row 4: Group Headers (Hourly / Salaried)
    const groupHeaders = ['', '', 'Hourly', '', '', '', '', '', '', 'Salaried', '', '', '', '', '', '']
    worksheet.addRow(groupHeaders)
    const groupRow = worksheet.getRow(4)
    worksheet.mergeCells('C4:I4')
    worksheet.mergeCells('J4:N4')
    groupRow.font = { bold: true }
    groupRow.alignment = { horizontal: 'center' }
    // Style Hourly group header (C4:I4)
    for (let i = 3; i <= 9; i++) {
      groupRow.getCell(i).fill = blueHeaderFill
    }
    // Style Salaried group header (J4:N4)
    for (let i = 10; i <= 14; i++) {
      groupRow.getCell(i).fill = blueHeaderFill
    }

    // Row 5: Column Headers
    const headers = [
      '', '', 'Active', 'Furlough', 'Paid Leave', 'Suspended', 'Unpaid Leave', 
      'Hrly Legacy', 'Hrly Doors', 'Active', 'Paid Leave', 'Unpaid Leave', 
      'Sal Legacy', 'Sal Doors', 'Total Legacy', 'Total Doors'
    ]
    worksheet.addRow(headers)
    
    // Style Header Row (Row 5)
    const headerRow = worksheet.getRow(5)
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center', wrapText: true }
    // Hourly columns (C-G) - blue
    for (let i = 3; i <= 7; i++) {
      headerRow.getCell(i).fill = blueHeaderFill
    }
    // Hrly Legacy & Hrly Doors (H-I) - purple
    headerRow.getCell(8).fill = purpleFill
    headerRow.getCell(9).fill = purpleFill
    // Salaried columns (J-L) - blue
    for (let i = 10; i <= 12; i++) {
      headerRow.getCell(i).fill = blueHeaderFill
    }
    // Sal Legacy & Sal Doors (M-N) - purple
    headerRow.getCell(13).fill = purpleFill
    headerRow.getCell(14).fill = purpleFill
    // Total Legacy & Total Doors (O-P) - purple
    headerRow.getCell(15).fill = purpleFill
    headerRow.getCell(16).fill = purpleFill

    // Track state rows for merging
    const stateStartRows: { [state: string]: number } = {}
    const stateEndRows: { [state: string]: number } = {}
    
    // Add Data Rows starting at row 6
    let rowNum = 6
    let prevState = ''
    
    filteredData.forEach((item, index) => {
      // Track state row ranges for merging
      if (item.state !== prevState) {
        if (prevState) {
          stateEndRows[prevState] = rowNum - 1
        }
        stateStartRows[item.state] = rowNum
        prevState = item.state
      }
      
      const row = worksheet.addRow([
        item.state,
        item.location,
        item.hourlyActive || '', 
        item.hourlyFurlough || '',
        item.hourlyPaidLeave || '',
        item.hourlySuspended || '',
        item.hourlyUnpaidLeave || '',
        { formula: `C${rowNum}+D${rowNum}+E${rowNum}+F${rowNum}+G${rowNum}` }, // Hrly Legacy = sum of hourly columns
        { formula: `C${rowNum}+D${rowNum}+E${rowNum}+F${rowNum}+G${rowNum}` }, // Hrly Doors = sum of hourly columns
        item.salariedActive || '',
        item.salariedPaidLeave || '',
        item.salariedUnpaidLeave || '',
        { formula: `J${rowNum}+K${rowNum}+L${rowNum}` }, // Sal Legacy = sum of salaried columns
        { formula: `J${rowNum}+K${rowNum}+L${rowNum}` }, // Sal Doors = sum of salaried columns
        { formula: `H${rowNum}+M${rowNum}` }, // Total Legacy = Hrly Legacy + Sal Legacy
        { formula: `I${rowNum}+N${rowNum}` }  // Total Doors = Hrly Doors + Sal Doors
      ])
      
      // Apply colors to data cells
      // Hourly columns (C-G) - blue
      for (let i = 3; i <= 7; i++) {
        row.getCell(i).fill = blueDataFill
      }
      // Hrly Legacy (H) - purple
      row.getCell(8).fill = purpleFill
      // Hrly Doors (I) - blue
      row.getCell(9).fill = blueDataFill
      // Salaried columns (J-L) - blue
      for (let i = 10; i <= 12; i++) {
        row.getCell(i).fill = blueDataFill
      }
      // Sal Legacy (M) - purple
      row.getCell(13).fill = purpleFill
      // Sal Doors (N) - purple
      row.getCell(14).fill = purpleFill
      // Total Legacy (O) - purple
      row.getCell(15).fill = purpleFill
      // Total Doors (P) - purple
      row.getCell(16).fill = purpleFill
      
      // Add borders to all cells
      for (let i = 1; i <= 16; i++) {
        row.getCell(i).border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      }
      
      rowNum++
    })
    
    // Record the last state's end row
    if (prevState) {
      stateEndRows[prevState] = rowNum - 1
    }
    
    // Merge state cells vertically
    Object.keys(stateStartRows).forEach((state) => {
      const startRow = stateStartRows[state]
      const endRow = stateEndRows[state]
      if (startRow && endRow && endRow > startRow) {
        worksheet.mergeCells(`A${startRow}:A${endRow}`)
      }
    })
    
    // Style state column - vertical alignment
    for (let r = 6; r < rowNum; r++) {
      const cell = worksheet.getRow(r).getCell(1)
      cell.alignment = { vertical: 'middle' }
    }

    // Add Grand Total Row
    const totalRowData: (string | number | { formula: string })[] = ['Grand Total', '']
    for (let col = 3; col <= 16; col++) {
      const colLetter = String.fromCharCode(64 + col)
      totalRowData.push({ formula: `SUM(${colLetter}6:${colLetter}${rowNum - 1})` })
    }
    const totalRow = worksheet.addRow(totalRowData)
    totalRow.font = { bold: true }
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } }
    })

    // Adjust Column Widths
    worksheet.getColumn(1).width = 15
    worksheet.getColumn(2).width = 22
    for (let i = 3; i <= 16; i++) {
      worksheet.getColumn(i).width = 10
    }

    // Trigger Browser Download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `Workforce_Report_${today.toISOString().split('T')[0]}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button variant="ghost" className="w-fit gap-2" asChild>
            <Link href="/report">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                Corporate Workforce Report
              </h1>
              <p className="text-muted-foreground mt-2">
                Workforce distribution by state, location, and employment status
              </p>
            </div>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Export to Excel
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{Object.keys(groupedData).length}</div>
              <p className="text-xs text-muted-foreground">Total States</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredData.length}</div>
              <p className="text-xs text-muted-foreground">Total Locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.totalLegacy.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Legacy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.totalDoors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Doors</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-bold">Workforce Data</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredData.length} locations across {Object.keys(groupedData).length} states
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by state or location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  {/* Group Header Row */}
                  <TableRow className="border-b-0">
                    <TableHead className="border-r" rowSpan={2}></TableHead>
                    <TableHead className="border-r" rowSpan={2}></TableHead>
                    <TableHead colSpan={7} className="text-center bg-blue-200 dark:bg-blue-900 font-bold border-r">Hourly</TableHead>
                    <TableHead colSpan={5} className="text-center bg-blue-200 dark:bg-blue-900 font-bold border-r">Salaried</TableHead>
                    <TableHead colSpan={2} className="text-center bg-purple-200 dark:bg-purple-900 font-bold"></TableHead>
                  </TableRow>
                  {/* Sub-header Row */}
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Active</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Furlough</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Paid Leave</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Suspended</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Unpaid Leave</TableHead>
                    <TableHead className="text-center bg-purple-200 dark:bg-purple-900 whitespace-nowrap text-xs">Hrly Legacy</TableHead>
                    <TableHead className="text-center bg-purple-200 dark:bg-purple-900 whitespace-nowrap text-xs border-r">Hrly Doors</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Active</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Paid Leave</TableHead>
                    <TableHead className="text-center bg-blue-100 dark:bg-blue-950 whitespace-nowrap text-xs">Unpaid Leave</TableHead>
                    <TableHead className="text-center bg-purple-200 dark:bg-purple-900 whitespace-nowrap text-xs">Sal Legacy</TableHead>
                    <TableHead className="text-center bg-purple-200 dark:bg-purple-900 whitespace-nowrap text-xs border-r">Sal Doors</TableHead>
                    <TableHead className="text-center bg-purple-200 dark:bg-purple-900 whitespace-nowrap text-xs">Total Legacy</TableHead>
                    <TableHead className="text-center bg-purple-200 dark:bg-purple-900 whitespace-nowrap text-xs">Total Doors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedData).map(([state, locations]) => (
                    locations.map((row, idx) => (
                      <TableRow key={`${state}-${row.location}`} className="hover:bg-muted/50">
                        <TableCell className="font-medium border-r">{idx === 0 ? state : ''}</TableCell>
                        <TableCell className="border-r">{row.location}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.hourlyActive || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.hourlyFurlough || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.hourlyPaidLeave || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.hourlySuspended || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.hourlyUnpaidLeave || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-100 dark:bg-purple-950">{row.hrlyLegacy || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-100 dark:bg-purple-950 border-r">{row.hrlyDoors || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.salariedActive || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.salariedPaidLeave || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-blue-50 dark:bg-blue-950/30">{row.salariedUnpaidLeave || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-100 dark:bg-purple-950">{row.salLegacy || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-100 dark:bg-purple-950 border-r">{row.salDoors || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-100 dark:bg-purple-950">{row.totalLegacy || ''}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-100 dark:bg-purple-950">{row.totalDoors || ''}</TableCell>
                      </TableRow>
                    ))
                  ))}
                  {/* Grand Total Row */}
                  <TableRow className="font-bold bg-muted border-t-2">
                    <TableCell colSpan={2} className="border-r">Grand Total</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.hourlyActive || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.hourlyFurlough || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.hourlyPaidLeave || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.hourlySuspended || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.hourlyUnpaidLeave || ''}</TableCell>
                    <TableCell className="text-center bg-purple-100 dark:bg-purple-950">{totals.hrlyLegacy || ''}</TableCell>
                    <TableCell className="text-center bg-purple-100 dark:bg-purple-950 border-r">{totals.hrlyDoors || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.salariedActive || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.salariedPaidLeave || ''}</TableCell>
                    <TableCell className="text-center bg-blue-50 dark:bg-blue-950/30">{totals.salariedUnpaidLeave || ''}</TableCell>
                    <TableCell className="text-center bg-purple-100 dark:bg-purple-950">{totals.salLegacy || ''}</TableCell>
                    <TableCell className="text-center bg-purple-100 dark:bg-purple-950 border-r">{totals.salDoors || ''}</TableCell>
                    <TableCell className="text-center bg-purple-100 dark:bg-purple-950">{totals.totalLegacy || ''}</TableCell>
                    <TableCell className="text-center bg-purple-100 dark:bg-purple-950">{totals.totalDoors || ''}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

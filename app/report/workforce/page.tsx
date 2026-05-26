"use client"

import React, { useState } from 'react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, ArrowLeft, Building2 } from "lucide-react"
import ExcelJS from 'exceljs'

// Parsed dataset from the raw text export
const rawData = [
  { state: "Alabama", location: "Alabama Resident Office", hourly: 10, salaried: 6, active: 4, furlough: 6, paidLeave: 4, suspended: 0, unpaidLeave: 0, hrlyLegacy: 10, hrlyDoors: 6, salActive: 4, salPaidLeave: 6, salLegacy: 4, salDoors: 6 },
  { state: "Alabama", location: "Haleyville", hourly: 214, salaried: 17, active: 2, furlough: 2, paidLeave: 21, suspended: 8, unpaidLeave: 18, hrlyLegacy: 0, hrlyDoors: 240, salActive: 24, salPaidLeave: 0, salLegacy: 24, salDoors: 0 },
  { state: "Arizona", location: "Arizona Resident Office", hourly: 13, salaried: 13, active: 13, furlough: 0, paidLeave: 0, suspended: 0, unpaidLeave: 0, hrlyLegacy: 13, hrlyDoors: 13, salActive: 13, salPaidLeave: 0, salLegacy: 13, salDoors: 0 },
  { state: "Arizona", location: "Eloy AZ Western Ins Plt", hourly: 1, salaried: 1, active: 1, furlough: 1, paidLeave: 1, suspended: 1, unpaidLeave: 0, hrlyLegacy: 1, hrlyDoors: 1, salActive: 1, salPaidLeave: 0, salLegacy: 1, salDoors: 0 },
  { state: "Arkansas", location: "Arkansas Resident Office", hourly: 9, salaried: 9, active: 9, furlough: 0, paidLeave: 0, suspended: 0, unpaidLeave: 0, hrlyLegacy: 9, hrlyDoors: 9, salActive: 9, salPaidLeave: 0, salLegacy: 9, salDoors: 0 },
  { state: "Arkansas", location: "Fort Smith Plant", hourly: 114, salaried: 1, active: 1, furlough: 1, paidLeave: 1, suspended: 1, unpaidLeave: 6, hrlyLegacy: 42, hrlyDoors: 42, salActive: 15, salPaidLeave: 8, salLegacy: 0, salDoors: 0 },
  { state: "Arkansas", location: "Russellville Plant", hourly: 49, salaried: 49, active: 6, furlough: 6, paidLeave: 5, suspended: 5, unpaidLeave: 0, hrlyLegacy: 49, hrlyDoors: 49, salActive: 6, salPaidLeave: 6, salLegacy: 5, salDoors: 5 },
  { state: "California", location: "California Resident Office", hourly: 22, salaried: 5, active: 4, furlough: 1, paidLeave: 3, suspended: 7, unpaidLeave: 18, hrlyLegacy: 3, hrlyDoors: 9, salActive: 18, salPaidLeave: 3, salLegacy: 9, salDoors: 18 },
  { state: "California", location: "Compton Asphalt Plant", hourly: 15, salaried: 15, active: 2, furlough: 2, paidLeave: 21, suspended: 7, unpaidLeave: 0, hrlyLegacy: 15, hrlyDoors: 15, salActive: 2, salPaidLeave: 2, salLegacy: 17, salDoors: 0 },
  { state: "California", location: "Compton Roofing Plant", hourly: 9, salaried: 9, active: 2, furlough: 1, paidLeave: 0, suspended: 1, unpaidLeave: 1, hrlyLegacy: 9, hrlyDoors: 19, salActive: 19, salPaidLeave: 1, salLegacy: 20, salDoors: 0 },
  { state: "California", location: "Corona", hourly: 21, salaried: 21, active: 5, furlough: 2, paidLeave: 2, suspended: 7, unpaidLeave: 5, hrlyLegacy: 25, hrlyDoors: 20, salActive: 27, salPaidLeave: 9, salLegacy: 5, salDoors: 20 },
  { state: "California", location: "Moreno Valley", hourly: 137, salaried: 128, active: 1, furlough: 6, paidLeave: 6, suspended: 1, unpaidLeave: 6, hrlyLegacy: 16, hrlyDoors: 16, salActive: 0, salPaidLeave: 18, salLegacy: 2, salDoors: 0 },
  { state: "Colorado", location: "Colorado Resident Office", hourly: 3, salaried: 1, active: 26, furlough: 5, paidLeave: 26, suspended: 5, unpaidLeave: 0, hrlyLegacy: 3, hrlyDoors: 1, salActive: 26, salPaidLeave: 5, salLegacy: 26, salDoors: 5 },
  { state: "Colorado", location: "Denver Asphalt Plant", hourly: 23, salaried: 23, active: 1, furlough: 1, paidLeave: 24, suspended: 0, unpaidLeave: 0, hrlyLegacy: 23, hrlyDoors: 23, salActive: 1, salPaidLeave: 1, salLegacy: 24, salDoors: 0 },
  { state: "Colorado", location: "Denver Roofing Plant", hourly: 100, salaried: 1, furlough: 1, paidLeave: 1, suspended: 0, active: 1, unpaidLeave: 1, hrlyLegacy: 15, hrlyDoors: 15, salActive: 1, salPaidLeave: 1, salLegacy: 16, salDoors: 0 }
]

export default function WorkforceDashboard() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = rawData.filter(row => 
    row.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals
  const totals = filteredData.reduce((acc, row) => ({
    hourly: acc.hourly + row.hourly,
    salaried: acc.salaried + row.salaried,
    active: acc.active + row.active,
    hrlyLegacy: acc.hrlyLegacy + row.hrlyLegacy,
    hrlyDoors: acc.hrlyDoors + row.hrlyDoors,
    salLegacy: acc.salLegacy + row.salLegacy,
    salDoors: acc.salDoors + row.salDoors,
  }), { hourly: 0, salaried: 0, active: 0, hrlyLegacy: 0, hrlyDoors: 0, salLegacy: 0, salDoors: 0 })

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Workforce Report')

    // Title Row
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    worksheet.addRow([`Exported to Excel on ${dateStr}`])
    worksheet.mergeCells('A1:P1')
    worksheet.getRow(1).font = { italic: true, color: { argb: '7F8C8D' } }

    // Column Headers
    const headers = [
      'Location', 'Hourly', 'Salaried', 'Active', 'Furlough', 'Paid Leave', 
      'Suspended', 'Unpaid Leave', 'Hrly Legacy', 'Hrly Doors', 
      'Active (Sal)', 'Paid Leave (Sal)', 'Sal Legacy', 'Sal Doors', 
      'Total Legacy', 'Total Doors'
    ]
    worksheet.addRow(headers)
    
    // Style Header Row
    const headerRow = worksheet.getRow(2)
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C3E50' } }
    })

    // Add Data Rows with Formulated Links
    filteredData.forEach((item, index) => {
      const rowNum = index + 3 // Data starts on Excel row 3
      worksheet.addRow([
        `${item.state} - ${item.location}`,
        item.hourly, item.salaried, item.active, item.furlough, item.paidLeave,
        item.suspended, item.unpaidLeave, item.hrlyLegacy, item.hrlyDoors,
        item.salActive, item.salPaidLeave, item.salLegacy, item.salDoors,
        // Live Formulas calculated by Excel on open
        { formula: `I${rowNum}+M${rowNum}` }, // Total Legacy = Hrly Legacy + Sal Legacy
        { formula: `J${rowNum}+N${rowNum}` }  // Total Doors = Hrly Doors + Sal Doors
      ])
    })

    // Add Grand Total Bottom Row
    const totalRowNum = filteredData.length + 3
    const totalRowData: (string | { formula: string })[] = ['Grand Total']
    
    // Inject dynamic vertical SUM formulas for columns B through P
    for (let col = 2; col <= 16; col++) {
      const colLetter = String.fromCharCode(64 + col)
      totalRowData.push({ formula: `SUM(${colLetter}3:${colLetter}${totalRowNum - 1})` })
    }
    worksheet.addRow(totalRowData)

    // Style Grand Total Row
    const totalRow = worksheet.getRow(totalRowNum)
    totalRow.font = { bold: true }
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } }
    })

    // Adjust Column Widths dynamically
    worksheet.columns.forEach(col => { col.width = 18 })
    worksheet.getColumn(1).width = 35

    // Trigger Browser Download File
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
                Workforce distribution by location, employment type, and status
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
              <div className="text-2xl font-bold">{filteredData.length}</div>
              <p className="text-xs text-muted-foreground">Total Locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.hourly.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Hourly</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.salaried.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Salaried</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-bold">Workforce Data</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Showing {filteredData.length} locations</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by State or Plant location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold whitespace-nowrap">Facility Location</TableHead>
                    <TableHead className="whitespace-nowrap">Hourly</TableHead>
                    <TableHead className="whitespace-nowrap">Salaried</TableHead>
                    <TableHead className="whitespace-nowrap">Active</TableHead>
                    <TableHead className="whitespace-nowrap">Hrly Legacy</TableHead>
                    <TableHead className="whitespace-nowrap">Hrly Doors</TableHead>
                    <TableHead className="whitespace-nowrap">Sal Legacy</TableHead>
                    <TableHead className="whitespace-nowrap">Sal Doors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium whitespace-nowrap">{row.state} — {row.location}</TableCell>
                      <TableCell>{row.hourly}</TableCell>
                      <TableCell>{row.salaried}</TableCell>
                      <TableCell>{row.active}</TableCell>
                      <TableCell className="bg-muted/30 font-semibold">{row.hrlyLegacy}</TableCell>
                      <TableCell className="bg-muted/30 font-semibold">{row.hrlyDoors}</TableCell>
                      <TableCell className="bg-primary/5 font-semibold">{row.salLegacy}</TableCell>
                      <TableCell className="bg-primary/5 font-semibold">{row.salDoors}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted font-bold border-t-2">
                    <TableCell>Grand Total</TableCell>
                    <TableCell>{totals.hourly}</TableCell>
                    <TableCell>{totals.salaried}</TableCell>
                    <TableCell>{totals.active}</TableCell>
                    <TableCell className="bg-muted/50">{totals.hrlyLegacy}</TableCell>
                    <TableCell className="bg-muted/50">{totals.hrlyDoors}</TableCell>
                    <TableCell className="bg-primary/10">{totals.salLegacy}</TableCell>
                    <TableCell className="bg-primary/10">{totals.salDoors}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">* Export includes additional columns: Furlough, Paid Leave, Suspended, Unpaid Leave, Total Legacy, Total Doors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

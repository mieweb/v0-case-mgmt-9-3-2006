"use client"

import React, { useState, useMemo } from 'react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, ArrowLeft, Building2 } from "lucide-react"
import { useCases, getCurrentPay } from "@/contexts/cases-context"
import ExcelJS from 'exceljs'

interface LocationData {
  location: string
  hourly: number
  salaried: number
  active: number
  closed: number
  pending: number
  totalCases: number
}

export default function WorkforceDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const { cases } = useCases()

  // Aggregate case data by location
  const locationData = useMemo(() => {
    const locationMap: Record<string, LocationData> = {}

    cases.forEach(caseItem => {
      const location = caseItem.employeeLocation || "Unknown"
      
      if (!locationMap[location]) {
        locationMap[location] = {
          location,
          hourly: 0,
          salaried: 0,
          active: 0,
          closed: 0,
          pending: 0,
          totalCases: 0
        }
      }

      // Determine if hourly or salaried based on compensation history
      const currentPay = getCurrentPay(caseItem)
      if (currentPay) {
        if (currentPay.unit === "hourly") {
          locationMap[location].hourly++
        } else {
          locationMap[location].salaried++
        }
      } else {
        // Default to hourly if no compensation data
        locationMap[location].hourly++
      }

      // Count by status
      if (caseItem.status === "Open") {
        locationMap[location].active++
      } else if (caseItem.status === "Closed") {
        locationMap[location].closed++
      } else if (caseItem.status === "Pending") {
        locationMap[location].pending++
      }

      locationMap[location].totalCases++
    })

    return Object.values(locationMap).sort((a, b) => a.location.localeCompare(b.location))
  }, [cases])

  const filteredData = locationData.filter(row => 
    row.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals
  const totals = filteredData.reduce((acc, row) => ({
    hourly: acc.hourly + row.hourly,
    salaried: acc.salaried + row.salaried,
    active: acc.active + row.active,
    closed: acc.closed + row.closed,
    pending: acc.pending + row.pending,
    totalCases: acc.totalCases + row.totalCases,
  }), { hourly: 0, salaried: 0, active: 0, closed: 0, pending: 0, totalCases: 0 })

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Workforce Report')

    // Title Row
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    worksheet.addRow([`Exported to Excel on ${dateStr}`])
    worksheet.mergeCells('A1:G1')
    worksheet.getRow(1).font = { italic: true, color: { argb: '7F8C8D' } }

    // Column Headers
    const headers = [
      'Location', 'Hourly', 'Salaried', 'Active Cases', 'Closed Cases', 
      'Pending Cases', 'Total Cases'
    ]
    worksheet.addRow(headers)
    
    // Style Header Row
    const headerRow = worksheet.getRow(2)
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C3E50' } }
    })

    // Add Data Rows
    filteredData.forEach((item) => {
      worksheet.addRow([
        item.location,
        item.hourly, 
        item.salaried, 
        item.active, 
        item.closed,
        item.pending, 
        item.totalCases
      ])
    })

    // Add Grand Total Bottom Row
    const totalRowNum = filteredData.length + 3
    const totalRowData: (string | { formula: string })[] = ['Grand Total']
    
    // Inject dynamic vertical SUM formulas for columns B through G
    for (let col = 2; col <= 7; col++) {
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
                Workforce distribution by location, employment type, and case status
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
              <p className="text-xs text-muted-foreground">Total Active Cases</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-bold">Workforce Data by Location</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Showing {filteredData.length} locations from {totals.totalCases} total cases</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Hourly</TableHead>
                    <TableHead className="whitespace-nowrap">Salaried</TableHead>
                    <TableHead className="whitespace-nowrap">Active Cases</TableHead>
                    <TableHead className="whitespace-nowrap">Closed Cases</TableHead>
                    <TableHead className="whitespace-nowrap">Pending Cases</TableHead>
                    <TableHead className="whitespace-nowrap">Total Cases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium whitespace-nowrap">{row.location}</TableCell>
                          <TableCell>{row.hourly}</TableCell>
                          <TableCell>{row.salaried}</TableCell>
                          <TableCell className="bg-green-50 dark:bg-green-950/30">{row.active}</TableCell>
                          <TableCell className="bg-muted/30">{row.closed}</TableCell>
                          <TableCell className="bg-yellow-50 dark:bg-yellow-950/30">{row.pending}</TableCell>
                          <TableCell className="font-semibold">{row.totalCases}</TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted font-bold border-t-2">
                        <TableCell>Grand Total</TableCell>
                        <TableCell>{totals.hourly}</TableCell>
                        <TableCell>{totals.salaried}</TableCell>
                        <TableCell className="bg-green-100 dark:bg-green-950/50">{totals.active}</TableCell>
                        <TableCell className="bg-muted/50">{totals.closed}</TableCell>
                        <TableCell className="bg-yellow-100 dark:bg-yellow-950/50">{totals.pending}</TableCell>
                        <TableCell>{totals.totalCases}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">* Data aggregated from case management system. Hourly/Salaried determined by compensation history.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

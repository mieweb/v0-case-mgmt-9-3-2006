"use client"

import React, { useState, useMemo } from 'react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, ArrowLeft, Users } from "lucide-react"
import ExcelJS from 'exceljs'
import { useCases, getCurrentPay, type Case } from "@/contexts/cases-context"

interface LocationData {
  location: string
  headcountHourly: number
  headcountSalaried: number
  headcountTotal: number
  currentWithLwdHourly: number
  currentWithLwdSalaried: number
  currentWithLwdTotal: number
  openNoLwdHourly: number
  openNoLwdSalaried: number
  openNoLwdTotal: number
  allOpenHourly: number
  allOpenSalaried: number
  allOpenTotal: number
  percentOpen: number
}

interface ManagerData {
  managerName: string
  locations: LocationData[]
  totals: LocationData
}

// Helper to check if a case has LWD (Last Work Day) set
function hasLWD(caseItem: Case): boolean {
  return !!caseItem.lastWorkDate
}

// Helper to check if a case has RTW (Return to Work) date set
function hasRTW(caseItem: Case): boolean {
  return !!caseItem.returnToWorkDate
}

// Helper to check if case is open (not closed)
function isOpenCase(caseItem: Case): boolean {
  const status = caseItem.status?.toLowerCase() || ''
  return status !== 'closed' && status !== 'denied' && status !== 'withdrawn'
}

export default function CaseManagerSummaryReport() {
  const { cases } = useCases()
  const [searchTerm, setSearchTerm] = useState('')

  // Aggregate case data by case manager and location
  const managerData: ManagerData[] = useMemo(() => {
    const managerMap = new Map<string, Map<string, {
      headcountHourly: number
      headcountSalaried: number
      currentWithLwdHourly: number
      currentWithLwdSalaried: number
      openNoLwdHourly: number
      openNoLwdSalaried: number
      allOpenHourly: number
      allOpenSalaried: number
    }>>()

    cases.forEach(caseItem => {
      const manager = caseItem.caseManager || 'Unassigned'
      const location = caseItem.employeeLocation || 'Unknown'
      
      // Determine if hourly or salaried from compensation history
      const currentPay = getCurrentPay(caseItem)
      const isHourly = currentPay?.unit === 'hourly'
      
      // Get or create manager entry
      if (!managerMap.has(manager)) {
        managerMap.set(manager, new Map())
      }
      
      const locMap = managerMap.get(manager)!
      
      // Get or create location entry for this manager
      if (!locMap.has(location)) {
        locMap.set(location, {
          headcountHourly: 0,
          headcountSalaried: 0,
          currentWithLwdHourly: 0,
          currentWithLwdSalaried: 0,
          openNoLwdHourly: 0,
          openNoLwdSalaried: 0,
          allOpenHourly: 0,
          allOpenSalaried: 0,
        })
      }
      
      const locData = locMap.get(location)!
      
      // Count headcount (all cases regardless of status)
      if (isHourly) {
        locData.headcountHourly++
      } else {
        locData.headcountSalaried++
      }
      
      // Check if open case
      const isOpen = isOpenCase(caseItem)
      const hasLwd = hasLWD(caseItem)
      const hasRtw = hasRTW(caseItem)
      
      if (isOpen) {
        // All open cases
        if (isHourly) {
          locData.allOpenHourly++
        } else {
          locData.allOpenSalaried++
        }
        
        // Current with LWDs (open cases with LWD set)
        if (hasLwd) {
          if (isHourly) {
            locData.currentWithLwdHourly++
          } else {
            locData.currentWithLwdSalaried++
          }
        }
        
        // Current open cases with no LWDs or RTW
        if (!hasLwd && !hasRtw) {
          if (isHourly) {
            locData.openNoLwdHourly++
          } else {
            locData.openNoLwdSalaried++
          }
        }
      }
    })

    // Convert to array format with totals
    const result: ManagerData[] = []
    
    managerMap.forEach((locMap, managerName) => {
      const locations: LocationData[] = []
      const totals = {
        location: 'Total',
        headcountHourly: 0,
        headcountSalaried: 0,
        headcountTotal: 0,
        currentWithLwdHourly: 0,
        currentWithLwdSalaried: 0,
        currentWithLwdTotal: 0,
        openNoLwdHourly: 0,
        openNoLwdSalaried: 0,
        openNoLwdTotal: 0,
        allOpenHourly: 0,
        allOpenSalaried: 0,
        allOpenTotal: 0,
        percentOpen: 0,
      }
      
      locMap.forEach((data, location) => {
        const locData: LocationData = {
          location,
          headcountHourly: data.headcountHourly,
          headcountSalaried: data.headcountSalaried,
          headcountTotal: data.headcountHourly + data.headcountSalaried,
          currentWithLwdHourly: data.currentWithLwdHourly,
          currentWithLwdSalaried: data.currentWithLwdSalaried,
          currentWithLwdTotal: data.currentWithLwdHourly + data.currentWithLwdSalaried,
          openNoLwdHourly: data.openNoLwdHourly,
          openNoLwdSalaried: data.openNoLwdSalaried,
          openNoLwdTotal: data.openNoLwdHourly + data.openNoLwdSalaried,
          allOpenHourly: data.allOpenHourly,
          allOpenSalaried: data.allOpenSalaried,
          allOpenTotal: data.allOpenHourly + data.allOpenSalaried,
          percentOpen: 0,
        }
        locData.percentOpen = locData.headcountTotal > 0 
          ? (locData.allOpenTotal / locData.headcountTotal) * 100 
          : 0
        
        locations.push(locData)
        
        // Accumulate totals
        totals.headcountHourly += locData.headcountHourly
        totals.headcountSalaried += locData.headcountSalaried
        totals.headcountTotal += locData.headcountTotal
        totals.currentWithLwdHourly += locData.currentWithLwdHourly
        totals.currentWithLwdSalaried += locData.currentWithLwdSalaried
        totals.currentWithLwdTotal += locData.currentWithLwdTotal
        totals.openNoLwdHourly += locData.openNoLwdHourly
        totals.openNoLwdSalaried += locData.openNoLwdSalaried
        totals.openNoLwdTotal += locData.openNoLwdTotal
        totals.allOpenHourly += locData.allOpenHourly
        totals.allOpenSalaried += locData.allOpenSalaried
        totals.allOpenTotal += locData.allOpenTotal
      })
      
      totals.percentOpen = totals.headcountTotal > 0 
        ? (totals.allOpenTotal / totals.headcountTotal) * 100 
        : 0
      
      // Sort locations alphabetically
      locations.sort((a, b) => a.location.localeCompare(b.location))
      
      result.push({
        managerName,
        locations,
        totals,
      })
    })
    
    // Sort managers alphabetically
    result.sort((a, b) => a.managerName.localeCompare(b.managerName))
    
    return result
  }, [cases])

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return managerData
    
    const term = searchTerm.toLowerCase()
    return managerData.filter(manager => 
      manager.managerName.toLowerCase().includes(term) ||
      manager.locations.some(loc => loc.location.toLowerCase().includes(term))
    )
  }, [managerData, searchTerm])

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const totals = {
      headcountHourly: 0,
      headcountSalaried: 0,
      headcountTotal: 0,
      currentWithLwdHourly: 0,
      currentWithLwdSalaried: 0,
      currentWithLwdTotal: 0,
      openNoLwdHourly: 0,
      openNoLwdSalaried: 0,
      openNoLwdTotal: 0,
      allOpenHourly: 0,
      allOpenSalaried: 0,
      allOpenTotal: 0,
      percentOpen: 0,
    }
    
    filteredData.forEach(manager => {
      totals.headcountHourly += manager.totals.headcountHourly
      totals.headcountSalaried += manager.totals.headcountSalaried
      totals.headcountTotal += manager.totals.headcountTotal
      totals.currentWithLwdHourly += manager.totals.currentWithLwdHourly
      totals.currentWithLwdSalaried += manager.totals.currentWithLwdSalaried
      totals.currentWithLwdTotal += manager.totals.currentWithLwdTotal
      totals.openNoLwdHourly += manager.totals.openNoLwdHourly
      totals.openNoLwdSalaried += manager.totals.openNoLwdSalaried
      totals.openNoLwdTotal += manager.totals.openNoLwdTotal
      totals.allOpenHourly += manager.totals.allOpenHourly
      totals.allOpenSalaried += manager.totals.allOpenSalaried
      totals.allOpenTotal += manager.totals.allOpenTotal
    })
    
    totals.percentOpen = totals.headcountTotal > 0 
      ? (totals.allOpenTotal / totals.headcountTotal) * 100 
      : 0
    
    return totals
  }, [filteredData])

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Case Manager Summary')
    
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    
    // Colors
    const grayFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'E0E0E0' } }
    const grayHeaderFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'C0C0C0' } }
    
    const thinBorder = {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
    
    // Row 1: Date and report title
    worksheet.addRow([`${dateStr.split(',')[1]?.trim().split(' ')[0]}.${today.getDate()}.${today.getFullYear().toString().slice(-2)}`, '', `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()} Totals`])
    worksheet.getRow(1).font = { italic: true }
    
    // Row 2: Empty
    worksheet.addRow([])
    
    // Row 3: Group Headers
    const groupHeaders = ['', 'Headcount', '', '', 'Current w/LWDs', '', '', 'Current Open Cases\nNo LWDs or RTW', '', '', 'All Open Cases', '', '', '% open v headcount']
    worksheet.addRow(groupHeaders)
    const groupRow = worksheet.getRow(3)
    groupRow.font = { bold: true }
    groupRow.alignment = { horizontal: 'center', wrapText: true }
    
    // Row 4: Sub Headers
    const headers = ['', 'Hourly', 'Salaried', 'Total', 'Hourly', 'Salaried', 'Total', 'Hourly', 'Salaried', 'Total', 'Hourly', 'Salaried', 'Total', '']
    worksheet.addRow(headers)
    const headerRow = worksheet.getRow(4)
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center' }
    
    // Apply borders to header rows
    for (let i = 1; i <= 14; i++) {
      groupRow.getCell(i).border = thinBorder
      headerRow.getCell(i).border = thinBorder
    }
    
    // Track rows for each manager section
    let rowNum = 5
    let rowIndex = 0
    
    filteredData.forEach(manager => {
      // Manager name row
      const managerRow = worksheet.addRow([manager.managerName])
      managerRow.font = { bold: true }
      managerRow.getCell(1).fill = grayHeaderFill
      for (let i = 1; i <= 14; i++) {
        managerRow.getCell(i).border = thinBorder
      }
      rowNum++
      
      // Track start row for this manager's locations
      const managerStartRow = rowNum
      
      manager.locations.forEach((loc) => {
        const isGrayRow = rowIndex % 2 === 1
        const row = worksheet.addRow([
          loc.location,
          loc.headcountHourly || '',
          loc.headcountSalaried || '',
          { formula: `B${rowNum}+C${rowNum}` },
          loc.currentWithLwdHourly || '',
          loc.currentWithLwdSalaried || '',
          { formula: `E${rowNum}+F${rowNum}` },
          loc.openNoLwdHourly || '',
          loc.openNoLwdSalaried || '',
          { formula: `H${rowNum}+I${rowNum}` },
          loc.allOpenHourly || '',
          loc.allOpenSalaried || '',
          { formula: `K${rowNum}+L${rowNum}` },
          loc.percentOpen > 0 ? loc.percentOpen : ''
        ])
        
        // Apply borders and alternating colors
        for (let i = 1; i <= 14; i++) {
          row.getCell(i).border = thinBorder
          if (isGrayRow) {
            row.getCell(i).fill = grayFill
          }
        }
        
        // Format percentage column
        if (loc.percentOpen > 0) {
          row.getCell(14).numFmt = '0.00%'
          row.getCell(14).value = loc.percentOpen / 100
        }
        
        rowNum++
        rowIndex++
      })
      
      // Manager total row
      const totalRow = worksheet.addRow([
        'Total',
        { formula: `SUM(B${managerStartRow}:B${rowNum - 1})` },
        { formula: `SUM(C${managerStartRow}:C${rowNum - 1})` },
        { formula: `SUM(D${managerStartRow}:D${rowNum - 1})` },
        { formula: `SUM(E${managerStartRow}:E${rowNum - 1})` },
        { formula: `SUM(F${managerStartRow}:F${rowNum - 1})` },
        { formula: `SUM(G${managerStartRow}:G${rowNum - 1})` },
        { formula: `SUM(H${managerStartRow}:H${rowNum - 1})` },
        { formula: `SUM(I${managerStartRow}:I${rowNum - 1})` },
        { formula: `SUM(J${managerStartRow}:J${rowNum - 1})` },
        { formula: `SUM(K${managerStartRow}:K${rowNum - 1})` },
        { formula: `SUM(L${managerStartRow}:L${rowNum - 1})` },
        { formula: `SUM(M${managerStartRow}:M${rowNum - 1})` },
        { formula: `IF(D${rowNum}>0,M${rowNum}/D${rowNum},0)` }
      ])
      totalRow.font = { bold: true }
      totalRow.getCell(14).numFmt = '0.00%'
      for (let i = 1; i <= 14; i++) {
        totalRow.getCell(i).border = thinBorder
      }
      rowNum++
      
      // Empty row after each manager section
      worksheet.addRow([])
      rowNum++
    })
    
    // Grand Total row
    const grandTotalRow = worksheet.addRow([
      'Grand Total',
      grandTotals.headcountHourly,
      grandTotals.headcountSalaried,
      grandTotals.headcountTotal,
      grandTotals.currentWithLwdHourly,
      grandTotals.currentWithLwdSalaried,
      grandTotals.currentWithLwdTotal,
      grandTotals.openNoLwdHourly,
      grandTotals.openNoLwdSalaried,
      grandTotals.openNoLwdTotal,
      grandTotals.allOpenHourly,
      grandTotals.allOpenSalaried,
      grandTotals.allOpenTotal,
      grandTotals.percentOpen / 100
    ])
    grandTotalRow.font = { bold: true }
    grandTotalRow.getCell(14).numFmt = '0.00%'
    for (let i = 1; i <= 14; i++) {
      grandTotalRow.getCell(i).border = thinBorder
      grandTotalRow.getCell(i).fill = grayHeaderFill
    }
    
    // Adjust column widths
    worksheet.getColumn(1).width = 25
    for (let i = 2; i <= 13; i++) {
      worksheet.getColumn(i).width = 10
    }
    worksheet.getColumn(14).width = 15
    
    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Case_Manager_Summary_${today.toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalLocations = filteredData.reduce((sum, m) => sum + m.locations.length, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/report" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Case Manager Summary Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {totalLocations} locations across {filteredData.length} case managers
                  </p>
                </div>
              </div>
              <Button onClick={exportToExcel} className="gap-2">
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by manager or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Data Preview Table */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  {/* Group Header Row */}
                  <TableRow className="border-b-0">
                    <TableHead className="border" rowSpan={2}></TableHead>
                    <TableHead colSpan={3} className="text-center bg-gray-300 dark:bg-gray-700 font-bold border">Headcount</TableHead>
                    <TableHead colSpan={3} className="text-center bg-gray-300 dark:bg-gray-700 font-bold border">Current w/LWDs</TableHead>
                    <TableHead colSpan={3} className="text-center bg-gray-300 dark:bg-gray-700 font-bold border">Current Open Cases<br/>No LWDs or RTW</TableHead>
                    <TableHead colSpan={3} className="text-center bg-gray-300 dark:bg-gray-700 font-bold border">All Open Cases</TableHead>
                    <TableHead className="text-center bg-gray-300 dark:bg-gray-700 font-bold border" rowSpan={2}>% open v<br/>headcount</TableHead>
                  </TableRow>
                  {/* Sub-header Row */}
                  <TableRow>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Hourly</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Salaried</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border-2 border-r-gray-500">Total</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Hourly</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Salaried</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border-2 border-r-gray-500">Total</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Hourly</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Salaried</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border-2 border-r-gray-500">Total</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Hourly</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border">Salaried</TableHead>
                    <TableHead className="text-center whitespace-nowrap text-xs border-2 border-r-gray-500">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((manager) => (
                    <React.Fragment key={manager.managerName}>
                      {/* Manager Name Row */}
                      <TableRow className="bg-gray-200 dark:bg-gray-700">
                        <TableCell colSpan={14} className="font-bold border">{manager.managerName}</TableCell>
                      </TableRow>
                      {/* Location Rows */}
                      {manager.locations.map((loc, idx) => {
                        const isGrayRow = idx % 2 === 1
                        return (
                          <TableRow key={`${manager.managerName}-${loc.location}`} className={isGrayRow ? 'bg-gray-100 dark:bg-gray-800' : ''}>
                            <TableCell className="border pl-6">{loc.location}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.headcountHourly || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.headcountSalaried || ''}</TableCell>
                            <TableCell className="text-center text-sm border-2 border-r-gray-500 font-medium">{loc.headcountTotal || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.currentWithLwdHourly || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.currentWithLwdSalaried || ''}</TableCell>
                            <TableCell className="text-center text-sm border-2 border-r-gray-500 font-medium">{loc.currentWithLwdTotal || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.openNoLwdHourly || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.openNoLwdSalaried || ''}</TableCell>
                            <TableCell className="text-center text-sm border-2 border-r-gray-500 font-medium">{loc.openNoLwdTotal || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.allOpenHourly || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.allOpenSalaried || ''}</TableCell>
                            <TableCell className="text-center text-sm border-2 border-r-gray-500 font-medium">{loc.allOpenTotal || ''}</TableCell>
                            <TableCell className="text-center text-sm border">{loc.percentOpen > 0 ? `${loc.percentOpen.toFixed(2)}%` : ''}</TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Manager Total Row */}
                      <TableRow className="font-bold border-t-2">
                        <TableCell className="border">Total</TableCell>
                        <TableCell className="text-center border">{manager.totals.headcountHourly || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.headcountSalaried || ''}</TableCell>
                        <TableCell className="text-center border-2 border-r-gray-500">{manager.totals.headcountTotal || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.currentWithLwdHourly || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.currentWithLwdSalaried || ''}</TableCell>
                        <TableCell className="text-center border-2 border-r-gray-500">{manager.totals.currentWithLwdTotal || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.openNoLwdHourly || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.openNoLwdSalaried || ''}</TableCell>
                        <TableCell className="text-center border-2 border-r-gray-500">{manager.totals.openNoLwdTotal || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.allOpenHourly || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.allOpenSalaried || ''}</TableCell>
                        <TableCell className="text-center border-2 border-r-gray-500">{manager.totals.allOpenTotal || ''}</TableCell>
                        <TableCell className="text-center border">{manager.totals.percentOpen > 0 ? `${manager.totals.percentOpen.toFixed(2)}%` : ''}</TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  {/* Grand Total Row */}
                  <TableRow className="font-bold bg-gray-200 dark:bg-gray-700 border-t-4">
                    <TableCell className="border">Grand Total</TableCell>
                    <TableCell className="text-center border">{grandTotals.headcountHourly || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.headcountSalaried || ''}</TableCell>
                    <TableCell className="text-center border-2 border-r-gray-500">{grandTotals.headcountTotal || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.currentWithLwdHourly || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.currentWithLwdSalaried || ''}</TableCell>
                    <TableCell className="text-center border-2 border-r-gray-500">{grandTotals.currentWithLwdTotal || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.openNoLwdHourly || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.openNoLwdSalaried || ''}</TableCell>
                    <TableCell className="text-center border-2 border-r-gray-500">{grandTotals.openNoLwdTotal || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.allOpenHourly || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.allOpenSalaried || ''}</TableCell>
                    <TableCell className="text-center border-2 border-r-gray-500">{grandTotals.allOpenTotal || ''}</TableCell>
                    <TableCell className="text-center border">{grandTotals.percentOpen > 0 ? `${grandTotals.percentOpen.toFixed(2)}%` : ''}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

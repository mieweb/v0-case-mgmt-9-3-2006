"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Save, X, Plus, Trash2, Check, DollarSign, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCases } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PayEntry {
  id: string
  payCode: string
  payCodeDescription: string
  startDate: string
  endDate?: string
  amount: string
  frequency: "weekly" | "bi-weekly" | "monthly"
  isActive: boolean
  notes?: string
}

export function PayInformationTab() {
  const { currentCase, updateCase } = useCases()
  const { codes } = useAdmin()

  // FICA Date State
  const [ficaDate, setFicaDate] = useState("")

  // Pay Entries State (like absence entries)
  const [payEntries, setPayEntries] = useState<PayEntry[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    payCode: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    amount: "",
    frequency: "bi-weekly" as "weekly" | "bi-weekly" | "monthly",
    notes: "",
  })

  // Calculate FICA date (date of disability + 6 months + first day of next month)
  const calculateFicaDate = (dateOfDisability: string): string => {
    if (!dateOfDisability) return ""
    
    const disabilityDate = new Date(dateOfDisability + "T00:00:00")
    if (isNaN(disabilityDate.getTime())) {
      return ""
    }
    
    // Add 6 months
    disabilityDate.setMonth(disabilityDate.getMonth() + 6)
    
    // Move to first day of next month
    disabilityDate.setMonth(disabilityDate.getMonth() + 1)
    disabilityDate.setDate(1)
    
    return disabilityDate.toISOString().split("T")[0]
  }

  // Load data from case
  useEffect(() => {
    if (currentCase) {
      setFicaDate(currentCase.ficaDate || "")
      setPayEntries(currentCase.payEntries || [])
      
      // Calculate FICA date if we have date of disability
      if (currentCase.dateOfDisability) {
        const calculatedFica = calculateFicaDate(currentCase.dateOfDisability)
        if (calculatedFica && calculatedFica !== currentCase.ficaDate) {
          setFicaDate(calculatedFica)
          updateCase(currentCase.caseNumber, { ficaDate: calculatedFica })
        }
      }
    }
  }, [currentCase?.caseNumber, currentCase?.dateOfDisability])

  // Get pay code description
  const getPayCodeDescription = (code: string) => {
    const found = codes.payCodes.find((c) => c.code === code)
    return found?.description || code
  }

  // Filter entries
  const filteredEntries = payEntries.filter((entry) => {
    if (filterActive === "active" && !entry.isActive) return false
    if (filterActive === "inactive" && entry.isActive) return false
    return true
  })

  // Add new pay entry
  const handleAddEntry = () => {
    if (!formData.payCode || !formData.startDate || !formData.amount) return

    const newEntry: PayEntry = {
      id: Date.now().toString(),
      payCode: formData.payCode,
      payCodeDescription: getPayCodeDescription(formData.payCode),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      amount: formData.amount,
      frequency: formData.frequency,
      isActive: true,
      notes: formData.notes || undefined,
    }

    const updatedEntries = [...payEntries, newEntry]
    setPayEntries(updatedEntries)
    if (currentCase) {
      updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
    }

    setFormData({
      payCode: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      amount: "",
      frequency: "bi-weekly",
      notes: "",
    })
    setShowAddDialog(false)
  }

  // Edit entry
  const handleStartEdit = (entry: PayEntry) => {
    setEditingId(entry.id)
    setFormData({
      payCode: entry.payCode,
      startDate: entry.startDate,
      endDate: entry.endDate || "",
      amount: entry.amount,
      frequency: entry.frequency,
      notes: entry.notes || "",
    })
  }

  const handleSaveEdit = () => {
    if (!editingId) return

    const updatedEntries = payEntries.map((e) =>
      e.id === editingId
        ? {
            ...e,
            payCode: formData.payCode,
            payCodeDescription: getPayCodeDescription(formData.payCode),
            startDate: formData.startDate,
            endDate: formData.endDate || undefined,
            amount: formData.amount,
            frequency: formData.frequency,
            notes: formData.notes || undefined,
          }
        : e
    )
    setPayEntries(updatedEntries)
    if (currentCase) {
      updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
    }
    setEditingId(null)
    setFormData({
      payCode: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      amount: "",
      frequency: "bi-weekly",
      notes: "",
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      payCode: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      amount: "",
      frequency: "bi-weekly",
      notes: "",
    })
  }

  // Delete entry
  const handleDelete = (id: string) => {
    const updatedEntries = payEntries.filter((e) => e.id !== id)
    setPayEntries(updatedEntries)
    if (currentCase) {
      updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
    }
  }

  // Toggle active status
  const handleToggleActive = (id: string) => {
    const updatedEntries = payEntries.map((e) =>
      e.id === id ? { ...e, isActive: !e.isActive } : e
    )
    setPayEntries(updatedEntries)
    if (currentCase) {
      updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
    }
  }

  // Group pay codes by category for the dropdown
  const payCodesByCategory = codes.payCodes.reduce((acc, code) => {
    const cat = (code as { category?: string }).category || "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(code)
    return acc
  }, {} as Record<string, typeof codes.payCodes>)

  return (
    <div className="space-y-6">
      {/* FICA Date Info */}
      {ficaDate && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>FICA Date</AlertTitle>
          <AlertDescription>
            Auto-calculated FICA Date: <strong>{new Date(ficaDate + "T00:00:00").toLocaleDateString()}</strong>
            <span className="text-muted-foreground ml-2">(Date of disability + 6 months + first day of next month)</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Pay Entries Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pay Code Entries
              </CardTitle>
              <CardDescription>Track pay code assignments and history</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterActive} onValueChange={(val: "all" | "active" | "inactive") => setFilterActive(val)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pay Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Pay Code Entry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Pay Code</Label>
                      <Select value={formData.payCode} onValueChange={(val) => setFormData({ ...formData, payCode: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pay code..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(payCodesByCategory).map(([category, categoryCodes]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{category}</div>
                              {categoryCodes.filter(c => c.active).map((code) => (
                                <SelectItem key={code.id} value={code.code}>
                                  {code.code} - {code.description}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date (optional)</Label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-7"
                            value={formData.amount}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.]/g, '')
                              const parts = value.split('.')
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('')
                              } else if (parts[1]?.length > 2) {
                                value = parts[0] + '.' + parts[1].slice(0, 2)
                              }
                              setFormData({ ...formData, amount: value })
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={formData.frequency} onValueChange={(val: "weekly" | "bi-weekly" | "monthly") => setFormData({ ...formData, frequency: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Input
                        placeholder="Additional notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddEntry} disabled={!formData.payCode || !formData.startDate || !formData.amount}>
                        Add Entry
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pay code entries found. Click &quot;Add Pay Code&quot; to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Code</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className={!entry.isActive ? "opacity-50" : ""}>
                    {editingId === entry.id ? (
                      <>
                        <TableCell>
                          <Select value={formData.payCode} onValueChange={(val) => setFormData({ ...formData, payCode: val })}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {codes.payCodes.filter(c => c.active).map((code) => (
                                <SelectItem key={code.id} value={code.code}>
                                  {code.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            className="w-[140px]"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            className="w-[140px]"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative w-[100px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="text"
                              className="pl-7"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={formData.frequency} onValueChange={(val: "weekly" | "bi-weekly" | "monthly") => setFormData({ ...formData, frequency: val })}>
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Editing</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.payCode}</div>
                            <div className="text-xs text-muted-foreground">{entry.payCodeDescription}</div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(entry.startDate + "T00:00:00").toLocaleDateString()}</TableCell>
                        <TableCell>{entry.endDate ? new Date(entry.endDate + "T00:00:00").toLocaleDateString() : "—"}</TableCell>
                        <TableCell>${parseFloat(entry.amount).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{entry.frequency}</TableCell>
                        <TableCell>
                          <Badge variant={entry.isActive ? "default" : "secondary"}>
                            {entry.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleStartEdit(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleActive(entry.id)}>
                              {entry.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

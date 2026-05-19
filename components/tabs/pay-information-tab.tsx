"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, X, Plus, Trash2, DollarSign, AlertTriangle, Check } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { useCases, PayEntry } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { Textarea } from "@/components/ui/textarea"

export function PayInformationTab() {
  const { currentCase, updateCase } = useCases()
  const { codes } = useAdmin()

  // Pay Entries State (history)
  const [payEntries, setPayEntries] = useState<PayEntry[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    payStartDate: new Date().toISOString().split('T')[0],
    payEndDate: "",
    ficaDate: "",
    rateOfPay: "",
    rateOfPayType: "hourly" as "hourly" | "monthly",
    stdOffsetType: "",
    stdOffsetAmount: "",
    stdOffsetFrequency: "" as "" | "weekly" | "monthly",
    stdPlan: "",
    payCode: "",
    notes: "",
  })

  const [rateOfPayWarning, setRateOfPayWarning] = useState<string | null>(null)
  const [stdOffsetWarning, setStdOffsetWarning] = useState<string | null>(null)

  // Validate money amount
  const validateMoneyAmount = (value: string, fieldType: "hourly" | "monthly" | "offset"): string | null => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || value === "") return null
    
    if (numValue < 0) {
      return "Amount cannot be negative"
    }
    
    if (fieldType === "hourly") {
      if (numValue > 500) {
        return "Hourly rate seems unusually high (over $500/hr)"
      }
      if (numValue > 0 && numValue < 7) {
        return "Hourly rate seems unusually low (under minimum wage)"
      }
    } else if (fieldType === "monthly") {
      if (numValue > 100000) {
        return "Monthly rate seems unusually high (over $100,000/month)"
      }
      if (numValue > 0 && numValue < 1000) {
        return "Monthly rate seems unusually low (under $1,000/month)"
      }
    } else if (fieldType === "offset") {
      if (numValue > 50000) {
        return "Offset amount seems unusually high (over $50,000)"
      }
    }
    
    return null
  }

  // Calculate FICA date (date of disability + 6 months + first day of next month)
  const calculateFicaDate = (dateOfDisability: string): string => {
    if (!dateOfDisability) return ""
    
    const disabilityDate = new Date(dateOfDisability + "T00:00:00")
    if (isNaN(disabilityDate.getTime())) return ""

    const sixMonthsLater = new Date(disabilityDate)
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

    const nextMonth = new Date(sixMonthsLater)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)

    return nextMonth.toISOString().split("T")[0]
  }

  // Load data from case
  useEffect(() => {
    if (currentCase) {
      setPayEntries(currentCase.payEntries || [])
    }
  }, [currentCase?.caseNumber])

  // Auto-calculate FICA date when dialog opens
  useEffect(() => {
    if (showAddDialog && currentCase?.dateOfDisability && !formData.ficaDate) {
      const calculatedFica = calculateFicaDate(currentCase.dateOfDisability)
      if (calculatedFica) {
        setFormData(prev => ({ ...prev, ficaDate: calculatedFica }))
      }
    }
  }, [showAddDialog, currentCase?.dateOfDisability])

  // Get pay code description
  const getPayCodeDescription = (code: string) => {
    const found = codes.payCodes.find((pc) => pc.code === code)
    return found?.description || code
  }

  // Filter pay entries
  const filteredEntries = payEntries.filter((entry) => {
    if (filterActive === "active" && !entry.isActive) return false
    if (filterActive === "inactive" && entry.isActive) return false
    return true
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      payStartDate: new Date().toISOString().split('T')[0],
      payEndDate: "",
      ficaDate: currentCase?.dateOfDisability ? calculateFicaDate(currentCase.dateOfDisability) : "",
      rateOfPay: "",
      rateOfPayType: "hourly",
      stdOffsetType: "",
      stdOffsetAmount: "",
      stdOffsetFrequency: "",
      stdPlan: "",
      payCode: "",
      notes: "",
    })
    setRateOfPayWarning(null)
    setStdOffsetWarning(null)
  }

  // Add new pay entry
  const handleAddEntry = () => {
    if (!formData.payStartDate || !formData.payCode || !currentCase) return

    const newEntry: PayEntry = {
      id: Date.now().toString(),
      payStartDate: formData.payStartDate,
      payEndDate: formData.payEndDate || undefined,
      ficaDate: formData.ficaDate || undefined,
      rateOfPay: formData.rateOfPay,
      rateOfPayType: formData.rateOfPayType,
      stdOffsetType: formData.stdOffsetType || undefined,
      stdOffsetAmount: formData.stdOffsetAmount || undefined,
      stdOffsetFrequency: formData.stdOffsetFrequency || undefined,
      stdPlan: formData.stdPlan || undefined,
      payCode: formData.payCode,
      payCodeDescription: getPayCodeDescription(formData.payCode),
      isActive: true,
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
    }

    const updatedEntries = [...payEntries, newEntry]
    setPayEntries(updatedEntries)
    updateCase(currentCase.caseNumber, { payEntries: updatedEntries })

    resetForm()
    setShowAddDialog(false)
  }

  // Start editing
  const handleStartEdit = (entry: PayEntry) => {
    setEditingId(entry.id)
    setFormData({
      payStartDate: entry.payStartDate,
      payEndDate: entry.payEndDate || "",
      ficaDate: entry.ficaDate || "",
      rateOfPay: entry.rateOfPay,
      rateOfPayType: entry.rateOfPayType,
      stdOffsetType: entry.stdOffsetType || "",
      stdOffsetAmount: entry.stdOffsetAmount || "",
      stdOffsetFrequency: entry.stdOffsetFrequency || "",
      stdPlan: entry.stdPlan || "",
      payCode: entry.payCode,
      notes: entry.notes || "",
    })
  }

  // Save edit
  const handleSaveEdit = () => {
    if (!editingId || !currentCase) return

    const updatedEntries = payEntries.map((entry) =>
      entry.id === editingId
        ? {
            ...entry,
            payStartDate: formData.payStartDate,
            payEndDate: formData.payEndDate || undefined,
            ficaDate: formData.ficaDate || undefined,
            rateOfPay: formData.rateOfPay,
            rateOfPayType: formData.rateOfPayType,
            stdOffsetType: formData.stdOffsetType || undefined,
            stdOffsetAmount: formData.stdOffsetAmount || undefined,
            stdOffsetFrequency: formData.stdOffsetFrequency || undefined,
            stdPlan: formData.stdPlan || undefined,
            payCode: formData.payCode,
            payCodeDescription: getPayCodeDescription(formData.payCode),
            notes: formData.notes || undefined,
          }
        : entry
    )

    setPayEntries(updatedEntries)
    updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
    setEditingId(null)
    resetForm()
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  // Toggle active status
  const handleToggleActive = (id: string) => {
    if (!currentCase) return

    const updatedEntries = payEntries.map((entry) =>
      entry.id === id ? { ...entry, isActive: !entry.isActive } : entry
    )

    setPayEntries(updatedEntries)
    updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
  }

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    if (!currentCase) return

    const updatedEntries = payEntries.filter((entry) => entry.id !== id)
    setPayEntries(updatedEntries)
    updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr + "T00:00:00").toLocaleDateString()
  }

  // Format currency for display
  const formatCurrency = (amount: string) => {
    if (!amount) return "—"
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Pay Information Form (used in dialog and inline edit)
  const PayInfoForm = ({ isInline = false }: { isInline?: boolean }) => (
    <div className={`space-y-4 ${isInline ? "" : "pt-4"}`}>
      {/* Row 1: Pay dates and FICA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Pay Start Date *</Label>
          <Input
            type="date"
            className="bg-background"
            value={formData.payStartDate}
            onChange={(e) => setFormData({ ...formData, payStartDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Pay End Date</Label>
          <Input
            type="date"
            className="bg-background"
            value={formData.payEndDate}
            onChange={(e) => setFormData({ ...formData, payEndDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            FICA Date <span className="text-xs italic">(auto-calculated)</span>
          </Label>
          <Input type="date" className="bg-muted/50" value={formData.ficaDate} readOnly />
          <p className="text-xs text-muted-foreground">
            Date of disability + 6 months + first day of next month
          </p>
        </div>
      </div>

      {/* Row 2: Rate of pay and STD offset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Rate of Pay</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`bg-background pl-7 ${rateOfPayWarning ? "border-amber-500" : ""}`}
                value={formData.rateOfPay}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, '')
                  const parts = value.split('.')
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('')
                  } else if (parts[1]?.length > 2) {
                    value = parts[0] + '.' + parts[1].slice(0, 2)
                  }
                  setFormData({ ...formData, rateOfPay: value })
                  setRateOfPayWarning(validateMoneyAmount(value, formData.rateOfPayType))
                }}
              />
            </div>
            <Select 
              value={formData.rateOfPayType} 
              onValueChange={(val: "hourly" | "monthly") => {
                setFormData({ ...formData, rateOfPayType: val })
                setRateOfPayWarning(validateMoneyAmount(formData.rateOfPay, val))
              }}
            >
              <SelectTrigger className="bg-background w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {rateOfPayWarning && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {rateOfPayWarning}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">STD Offset</Label>
          <div className="flex gap-2">
            <Select 
              value={formData.stdOffsetType} 
              onValueChange={(val) => setFormData({ ...formData, stdOffsetType: val })}
            >
              <SelectTrigger className="bg-background w-[140px]">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ssdi">SSDI</SelectItem>
                <SelectItem value="comp">Workers Comp</SelectItem>
                <SelectItem value="pers">PERS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`bg-background pl-7 ${stdOffsetWarning ? "border-amber-500" : ""}`}
                value={formData.stdOffsetAmount}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, '')
                  const parts = value.split('.')
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('')
                  } else if (parts[1]?.length > 2) {
                    value = parts[0] + '.' + parts[1].slice(0, 2)
                  }
                  setFormData({ ...formData, stdOffsetAmount: value })
                  setStdOffsetWarning(validateMoneyAmount(value, "offset"))
                }}
              />
            </div>
            <Select 
              value={formData.stdOffsetFrequency} 
              onValueChange={(val: "weekly" | "monthly") => setFormData({ ...formData, stdOffsetFrequency: val })}
            >
              <SelectTrigger className="bg-background w-[110px]">
                <SelectValue placeholder="Freq" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {stdOffsetWarning && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {stdOffsetWarning}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: STD Plan and Pay Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">STD Plan</Label>
          <Input
            placeholder="Plan name or code"
            className="bg-background"
            value={formData.stdPlan}
            onChange={(e) => setFormData({ ...formData, stdPlan: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Pay Code *</Label>
          <Select 
            value={formData.payCode} 
            onValueChange={(val) => setFormData({ ...formData, payCode: val })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select pay code..." />
            </SelectTrigger>
            <SelectContent>
              {codes.payCodes
                .filter((pc) => pc.active)
                .map((payCode) => (
                  <SelectItem key={payCode.id} value={payCode.code}>
                    {payCode.code} - {payCode.description}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          className="bg-background"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Pay Information History Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pay Information History
            </CardTitle>
            <CardDescription>Track pay information changes and history</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterActive} onValueChange={(val: "all" | "active" | "inactive") => setFilterActive(val)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pay Information
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add Pay Information</DialogTitle>
                </DialogHeader>
                <PayInfoForm />
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowAddDialog(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEntry} disabled={!formData.payStartDate || !formData.payCode}>
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pay information entries found. Click &quot;Add Pay Information&quot; to create one.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className={`${!entry.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="pt-4">
                    {editingId === entry.id ? (
                      <div className="space-y-4">
                        <PayInfoForm isInline />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.isActive ? "default" : "secondary"}>
                              {entry.payCode}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {entry.payCodeDescription}
                            </span>
                            {!entry.isActive && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(entry.id)}
                              title={entry.isActive ? "Mark Inactive" : "Mark Active"}
                            >
                              {entry.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Pay Period:</span>
                            <p className="font-medium">
                              {formatDate(entry.payStartDate)} - {entry.payEndDate ? formatDate(entry.payEndDate) : "Ongoing"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">FICA Date:</span>
                            <p className="font-medium">{entry.ficaDate ? formatDate(entry.ficaDate) : "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate of Pay:</span>
                            <p className="font-medium">
                              {formatCurrency(entry.rateOfPay)} / {entry.rateOfPayType === "hourly" ? "hr" : "mo"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">STD Plan:</span>
                            <p className="font-medium">{entry.stdPlan || "—"}</p>
                          </div>
                        </div>
                        {(entry.stdOffsetType || entry.stdOffsetAmount) && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">STD Offset:</span>
                            <p className="font-medium">
                              {entry.stdOffsetType?.toUpperCase() || ""} {formatCurrency(entry.stdOffsetAmount || "")} 
                              {entry.stdOffsetFrequency ? ` / ${entry.stdOffsetFrequency}` : ""}
                            </p>
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Notes:</span>
                            <p>{entry.notes}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

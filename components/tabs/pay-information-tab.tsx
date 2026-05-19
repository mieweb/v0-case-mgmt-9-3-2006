"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Save, X, Plus, Trash2, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { useCases, PayEntry } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { Textarea } from "@/components/ui/textarea"

export function PayInformationTab() {
  const { currentCase, updateCase } = useCases()
  const { codes } = useAdmin()

  // Pay Information State
  const [payStartDate, setPayStartDate] = useState("")
  const [payEndDate, setPayEndDate] = useState("")
  const [ficaDate, setFicaDate] = useState("")
  const [rateOfPayValue, setRateOfPayValue] = useState("")
  const [rateOfPayType, setRateOfPayType] = useState<"hourly" | "monthly">("hourly")
  const [rateOfPayWarning, setRateOfPayWarning] = useState<string | null>(null)
  const [stdOffsetType, setStdOffsetType] = useState("")
  const [stdOffsetAmountValue, setStdOffsetAmountValue] = useState("")
  const [stdOffsetFrequency, setStdOffsetFrequency] = useState("")
  const [stdOffsetAmountWarning, setStdOffsetAmountWarning] = useState<string | null>(null)
  const [stdPlan, setStdPlan] = useState("")
  const [selectedPayCode, setSelectedPayCode] = useState("")

  // Pay Entries State (history like absence entries)
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
      setPayStartDate(currentCase.payStartDate || "")
      setPayEndDate(currentCase.payEndDate || "")
      setFicaDate(currentCase.ficaDate || "")
      setStdPlan(currentCase.stdPlan || "")
      setSelectedPayCode((currentCase as { payCode?: string }).payCode || "")
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

  const handleFieldUpdate = (field: string, value: string) => {
    if (currentCase) {
      updateCase(currentCase.caseNumber, { [field]: value })
    }
  }

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

  // Add new pay entry
  const handleAddEntry = () => {
    if (!formData.payCode || !formData.startDate || !currentCase) return

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
    updateCase(currentCase.caseNumber, { payEntries: updatedEntries })

    // Reset form
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

  // Start editing
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

  // Save edit
  const handleSaveEdit = () => {
    if (!editingId || !currentCase) return

    const updatedEntries = payEntries.map((entry) =>
      entry.id === editingId
        ? {
            ...entry,
            payCode: formData.payCode,
            payCodeDescription: getPayCodeDescription(formData.payCode),
            startDate: formData.startDate,
            endDate: formData.endDate || undefined,
            amount: formData.amount,
            frequency: formData.frequency,
            notes: formData.notes || undefined,
          }
        : entry
    )

    setPayEntries(updatedEntries)
    updateCase(currentCase.caseNumber, { payEntries: updatedEntries })
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

  // Cancel edit
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

  return (
    <div className="space-y-6">
      {/* Pay Information Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pay Information
          </CardTitle>
          <CardDescription>Manage pay dates, rates, and STD offset information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Pay dates and FICA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-start" className="text-sm text-muted-foreground">
                Pay start date
              </Label>
              <Input
                id="pay-start"
                type="date"
                className="bg-background"
                value={payStartDate}
                onChange={(e) => {
                  setPayStartDate(e.target.value)
                  handleFieldUpdate("payStartDate", e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-end" className="text-sm text-muted-foreground">
                Pay end date
              </Label>
              <Input
                id="pay-end"
                type="date"
                className="bg-background"
                value={payEndDate}
                onChange={(e) => {
                  setPayEndDate(e.target.value)
                  handleFieldUpdate("payEndDate", e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fica-date" className="text-sm text-muted-foreground">
                FICA Date <span className="text-xs italic">(auto-calculated)</span>
              </Label>
              <Input id="fica-date" type="date" className="bg-muted/50" value={ficaDate} readOnly />
              <p className="text-xs text-muted-foreground mt-1">
                Date of disability + 6 months + first day of next month
              </p>
            </div>
          </div>

          {/* Row 2: Rate of pay and STD offset */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rate-of-pay" className="text-sm text-muted-foreground">
                Rate of Pay
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="rate-of-pay"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`bg-background pl-7 ${rateOfPayWarning ? "border-amber-500" : ""}`}
                    value={rateOfPayValue}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = value.split('.')
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('')
                      } else if (parts[1]?.length > 2) {
                        value = parts[0] + '.' + parts[1].slice(0, 2)
                      }
                      setRateOfPayValue(value)
                      setRateOfPayWarning(validateMoneyAmount(value, rateOfPayType))
                    }}
                  />
                </div>
                <Select value={rateOfPayType} onValueChange={(val: "hourly" | "monthly") => {
                  setRateOfPayType(val)
                  setRateOfPayWarning(validateMoneyAmount(rateOfPayValue, val))
                }}>
                  <SelectTrigger id="rate-type" className="bg-background w-[120px]">
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
              <Label htmlFor="std-offset-amount" className="text-sm text-muted-foreground">
                STD Offset
              </Label>
              <div className="flex gap-2">
                <Select value={stdOffsetType} onValueChange={setStdOffsetType}>
                  <SelectTrigger id="std-offset-type" className="bg-background w-[140px]">
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
                    id="std-offset-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`bg-background pl-7 ${stdOffsetAmountWarning ? "border-amber-500" : ""}`}
                    value={stdOffsetAmountValue}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = value.split('.')
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('')
                      } else if (parts[1]?.length > 2) {
                        value = parts[0] + '.' + parts[1].slice(0, 2)
                      }
                      setStdOffsetAmountValue(value)
                      setStdOffsetAmountWarning(validateMoneyAmount(value, "offset"))
                    }}
                  />
                </div>
                <Select value={stdOffsetFrequency} onValueChange={setStdOffsetFrequency}>
                  <SelectTrigger id="std-offset-frequency" className="bg-background w-[110px]">
                    <SelectValue placeholder="Freq" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {stdOffsetAmountWarning && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stdOffsetAmountWarning}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: STD Plan and Pay Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="std-plan" className="text-sm text-muted-foreground">
                STD Plan
              </Label>
              <Input
                id="std-plan"
                placeholder="Plan name or code"
                className="bg-background"
                value={stdPlan}
                onChange={(e) => {
                  setStdPlan(e.target.value)
                  handleFieldUpdate("stdPlan", e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-code" className="text-sm text-muted-foreground">
                Pay Code
              </Label>
              <Select value={selectedPayCode} onValueChange={(val) => {
                setSelectedPayCode(val)
                handleFieldUpdate("payCode", val)
              }}>
                <SelectTrigger id="pay-code" className="bg-background">
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
        </CardContent>
      </Card>

      {/* Pay Code Entries History Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pay Code Entries
            </CardTitle>
            <CardDescription>Track pay code assignments and history</CardDescription>
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
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pay Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Pay Code Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Pay Code</Label>
                    <Select value={formData.payCode} onValueChange={(val) => setFormData({ ...formData, payCode: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pay code..." />
                      </SelectTrigger>
                      <SelectContent>
                        {codes.payCodes
                          .filter((pc) => pc.active)
                          .map((pc) => (
                            <SelectItem key={pc.id} value={pc.code}>
                              {pc.code} - {pc.description}
                            </SelectItem>
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
                      <Label>End Date</Label>
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
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Optional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddEntry} disabled={!formData.payCode || !formData.startDate}>
                      Add Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pay code entries found. Click &quot;Add Pay Code&quot; to create one.
            </p>
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
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {codes.payCodes
                                .filter((pc) => pc.active)
                                .map((pc) => (
                                  <SelectItem key={pc.id} value={pc.code}>
                                    {pc.code}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative w-[100px]">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input
                              type="text"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                              className="pl-6"
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
                          <Badge variant={entry.isActive ? "default" : "secondary"}>
                            {entry.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4" />
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
                            <span className="font-medium">{entry.payCode}</span>
                            <p className="text-xs text-muted-foreground">{entry.payCodeDescription}</p>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(entry.startDate + "T00:00:00").toLocaleDateString()}</TableCell>
                        <TableCell>{entry.endDate ? new Date(entry.endDate + "T00:00:00").toLocaleDateString() : "—"}</TableCell>
                        <TableCell>{entry.amount ? `$${entry.amount}` : "—"}</TableCell>
                        <TableCell className="capitalize">{entry.frequency}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={entry.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(entry.id)}
                          >
                            {entry.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleStartEdit(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteEntry(entry.id)}>
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

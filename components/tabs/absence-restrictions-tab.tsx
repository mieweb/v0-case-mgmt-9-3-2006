"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Save, X, Plus, Trash2, Check, Calendar, ShieldAlert, AlertTriangle, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCases, Restriction } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { debug } from "@/lib/debug"

interface AbsenceEntry {
  id: string
  effectiveDate: string
  endDate?: string
  status: "FD" | "LWD" | "RWD" | "RWDREGULARJOB" | "OTH"
  reason?: string
  otherName?: string
  createdSeq: number
  isActive?: boolean
  caseNumber?: string
}

const getStatusOptions = (absenceStatusCodes: { code: string; description?: string; active?: boolean }[]) =>
  absenceStatusCodes
    .filter((c) => c.active)
    .map((c) => ({ value: c.code, label: c.description || c.code }))

export function AbsenceRestrictionsTab() {
  const { currentCase, updateCase, restrictions, addRestriction, updateRestriction, deleteRestriction, getRestrictionsForEmployee } = useCases()
  const { codes } = useAdmin()
  
  const statusOptions = getStatusOptions(codes.absenceStatus)

  

  // ===== ABSENCE STATE =====
  const [entries, setEntries] = useState<AbsenceEntry[]>([])
  const [effectiveDate, setEffectiveDate] = useState("")
  const [absenceEndDate, setAbsenceEndDate] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [otherName, setOtherName] = useState("")
  const [countThrough, setCountThrough] = useState(new Date().toISOString().split("T")[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ effectiveDate: string; endDate: string; status: string; reason: string; otherName: string }>({
    effectiveDate: "",
    endDate: "",
    status: "",
    reason: "",
    otherName: "",
  })
  const [absenceFilterActive, setAbsenceFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [absenceFilterCase, setAbsenceFilterCase] = useState<"all" | "current">("current")
  const [validationError, setValidationError] = useState<string | null>(null)

  // ===== RESTRICTIONS STATE =====
  const restrictionOptions = codes.restrictionCodes
    .filter((c) => c.active)
    .map((c) => ({ value: c.code, label: c.description || c.code }))

  const getRestrictionDisplayName = (code: string) => {
    const found = codes.restrictionCodes.find((c) => c.code === code)
    return found?.description || code
  }
  
  const [showDialog, setShowDialog] = useState(false)
  const [restrictionEditingId, setRestrictionEditingId] = useState<string | null>(null)
  const [restrictionFilterActive, setRestrictionFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [restrictionFilterCase, setRestrictionFilterCase] = useState<"all" | "current">("current")
  const [quickEntryMode, setQuickEntryMode] = useState(false)
  const [quickEntryData, setQuickEntryData] = useState({
    restriction: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    reviewDate: "",
    isPermanent: false,
    isActive: true,
    notes: "",
  })
  const [formData, setFormData] = useState({
    restriction: "",
    startDate: "",
    endDate: "",
    reviewDate: "",
    isPermanent: false,
    isActive: true,
    notes: "",
  })

  // ===== ABSENCE EFFECTS & HANDLERS =====
  useEffect(() => {
    if (currentCase?.absences) {
      setEntries(currentCase.absences)
    }
  }, [currentCase])

  const calculateDays = (entry: AbsenceEntry, nextDate: string) => {
    const start = new Date(entry.effectiveDate.replace(/-/g, "/"))
    const end = new Date(nextDate.replace(/-/g, "/"))
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getStatusCode = (status: string): string => {
    const match = status.match(/^([A-Z]+)/)
    return match ? match[1] : status
  }

  const filteredAbsenceEntries = entries.filter((entry) => {
    // An entry is considered inactive if it has an end date that is in the past
    const today = new Date().toISOString().split('T')[0]
    const isInactive = entry.endDate && entry.endDate < today
    if (absenceFilterActive === "active" && isInactive) return false
    if (absenceFilterActive === "inactive" && !isInactive) return false
    return true
  })

  const sortedEntries = [...filteredAbsenceEntries].sort((a, b) => {
    const dateCompare = a.effectiveDate.localeCompare(b.effectiveDate)
    return dateCompare !== 0 ? dateCompare : a.createdSeq - b.createdSeq
  })

  const entriesWithDays = sortedEntries.map((entry, index) => {
    const nextDate = index < sortedEntries.length - 1 ? sortedEntries[index + 1].effectiveDate : countThrough
    const days = calculateDays(entry, nextDate)
    const statusCode = getStatusCode(entry.status)
    return {
      ...entry,
      days: {
        FD: statusCode === "FD" ? days : 0,
        LWD: statusCode === "LWD" ? days : 0,
        RWD: statusCode === "RWD" ? days : 0,
        RWDREGULARJOB: statusCode === "RWDREGULARJOB" ? days : 0,
        OTH: statusCode === "OTH" ? days : 0,
      },
    }
  })

  const totals = entriesWithDays.reduce(
    (acc, entry) => ({
      FD: acc.FD + entry.days.FD,
      LWD: acc.LWD + entry.days.LWD,
      RWD: acc.RWD + entry.days.RWD,
      RWDREGULARJOB: acc.RWDREGULARJOB + entry.days.RWDREGULARJOB,
      OTH: acc.OTH + entry.days.OTH,
    }),
    { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0 },
  )

  // Audit: detect timeline issues
  type AuditIssue = {
    type: "consecutive" | "gap" | "overlap"
    severity: "error" | "warning"
    message: string
    entryIds: string[]
  }

  const auditIssues: AuditIssue[] = []
  
  // Check for consecutive same-status entries (invalid)
  for (let i = 1; i < sortedEntries.length; i++) {
    const prev = sortedEntries[i - 1]
    const curr = sortedEntries[i]
    const prevStatus = getStatusCode(prev.status)
    const currStatus = getStatusCode(curr.status)
    
    // Consecutive RWD entries
    if (prevStatus === "RWD" && currStatus === "RWD") {
      auditIssues.push({
        type: "consecutive",
        severity: "error",
        message: `Consecutive "Restricted Work Days" entries on ${prev.effectiveDate} and ${curr.effectiveDate}. Extend the end date of the existing entry instead.`,
        entryIds: [prev.id, curr.id],
      })
    }
    
    // Consecutive FD entries
    if (prevStatus === "FD" && currStatus === "FD") {
      auditIssues.push({
        type: "consecutive",
        severity: "error",
        message: `Consecutive "Full Duty" entries on ${prev.effectiveDate} and ${curr.effectiveDate}. Only one Full Duty entry is needed.`,
        entryIds: [prev.id, curr.id],
      })
    }

    // Consecutive LWD entries
    if (prevStatus === "LWD" && currStatus === "LWD") {
      auditIssues.push({
        type: "consecutive",
        severity: "error",
        message: `Consecutive "Lost Work Days" entries on ${prev.effectiveDate} and ${curr.effectiveDate}. Extend the period instead.`,
        entryIds: [prev.id, curr.id],
      })
    }
  }
  
  // Check for gaps (warning - same date entries are fine due to createdSeq)
  for (let i = 1; i < sortedEntries.length; i++) {
    const prev = sortedEntries[i - 1]
    const curr = sortedEntries[i]
    const prevDate = new Date(prev.effectiveDate.replace(/-/g, "/"))
    const currDate = new Date(curr.effectiveDate.replace(/-/g, "/"))
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // If there's a gap of more than 1 day, flag it as a warning
    if (diffDays > 1) {
      auditIssues.push({
        type: "gap",
        severity: "warning",
        message: `${diffDays - 1} day gap between entries on ${prev.effectiveDate} and ${curr.effectiveDate}.`,
        entryIds: [prev.id, curr.id],
      })
    }
  }

  // Check for overlaps (same effective date with same status)
  const dateStatusMap = new Map<string, AbsenceEntry[]>()
  for (const entry of sortedEntries) {
    const key = `${entry.effectiveDate}-${getStatusCode(entry.status)}`
    if (!dateStatusMap.has(key)) {
      dateStatusMap.set(key, [])
    }
    dateStatusMap.get(key)!.push(entry)
  }
  
  for (const [key, dupes] of dateStatusMap.entries()) {
    if (dupes.length > 1) {
      const [date, status] = key.split("-")
      auditIssues.push({
        type: "overlap",
        severity: "error",
        message: `Duplicate ${status} entries on ${date}.`,
        entryIds: dupes.map((d) => d.id),
      })
    }
  }

  // Validation function for new entries
  const validateNewEntry = (newStatus: string, newDate: string): string | null => {
    const newStatusCode = getStatusCode(newStatus)
    
    // Find the entry that would come immediately before this new one
    const sortedWithNew = [...sortedEntries, { effectiveDate: newDate, status: newStatus, id: "new", createdSeq: 999999 }]
      .sort((a, b) => {
        const dateCompare = a.effectiveDate.localeCompare(b.effectiveDate)
        return dateCompare !== 0 ? dateCompare : (a.createdSeq || 0) - (b.createdSeq || 0)
      })
    
    const newIndex = sortedWithNew.findIndex((e) => e.id === "new")
    
    // Check previous entry
    if (newIndex > 0) {
      const prev = sortedWithNew[newIndex - 1]
      const prevStatusCode = getStatusCode(prev.status)
      
      if (prevStatusCode === newStatusCode && (newStatusCode === "RWD" || newStatusCode === "FD" || newStatusCode === "LWD")) {
        const statusLabel = statusOptions.find((o) => o.value === newStatusCode)?.label || newStatusCode
        return `Cannot add consecutive "${statusLabel}" entries. Please extend the end date of the existing ${prev.effectiveDate} entry instead.`
      }
    }
    
    // Check next entry
    if (newIndex < sortedWithNew.length - 1) {
      const next = sortedWithNew[newIndex + 1]
      const nextStatusCode = getStatusCode(next.status)
      
      if (nextStatusCode === newStatusCode && (newStatusCode === "RWD" || newStatusCode === "FD" || newStatusCode === "LWD")) {
        const statusLabel = statusOptions.find((o) => o.value === newStatusCode)?.label || newStatusCode
        return `Cannot add consecutive "${statusLabel}" entries. There's already a ${statusLabel} entry on ${next.effectiveDate}.`
      }
    }
    
    return null
  }

  const handleAddEntry = () => {
    const isOther = selectedStatus.startsWith("OTH")
    const isRestricted = selectedStatus.startsWith("RWD")
    const employeeRestrictions = currentCase ? getRestrictionsForEmployee(currentCase.employeeNumber) : []
    
    if (!effectiveDate || !selectedStatus) {
      return
    }
    if (isOther && !selectedReason) {
      alert("Please select a reason when using Other status")
      return
    }
    if (isRestricted && employeeRestrictions.length === 0) {
      alert("Please add a work restriction before using RWD or RWDREGULARJOB status")
      return
    }

    // Validate against consecutive entries
    const error = validateNewEntry(selectedStatus, effectiveDate)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)

    const newEntry: AbsenceEntry = {
      id: Date.now().toString(),
      effectiveDate,
      endDate: absenceEndDate || undefined,
      status: selectedStatus as AbsenceEntry["status"],
      reason: selectedReason || undefined,
      otherName: selectedStatus.startsWith("OTH") ? otherName : undefined,
      createdSeq: Math.max(...entries.map((e) => e.createdSeq), 0) + 1,
    }

    const updatedEntries = [...entries, newEntry]
    setEntries(updatedEntries)
    if (currentCase) {
      updateCase(
        currentCase.caseNumber,
        { absences: updatedEntries },
        {
          action: "added",
          field: "absence",
          newValue: getStatusLabel(newEntry),
          description: `Added absence entry: ${getStatusLabel(newEntry)} on ${effectiveDate}`,
        },
      )
    }

    setEffectiveDate("")
    setAbsenceEndDate("")
    setSelectedStatus("")
    setSelectedReason("")
    setOtherName("")
  }

  const handleSave = () => {
    if (!editData.effectiveDate || !editData.status) return
    if (editData.status.startsWith("OTH") && !editData.otherName) return

    const oldEntry = entries.find((e) => e.id === editingId)
    const updatedEntries = entries.map((e) =>
      e.id === editingId
        ? {
            ...e,
            effectiveDate: editData.effectiveDate,
            endDate: editData.endDate || undefined,
            status: editData.status as AbsenceEntry["status"],
            reason: editData.reason || undefined,
            otherName: editData.otherName || undefined,
          }
        : e,
    )
    setEntries(updatedEntries)
    if (currentCase && oldEntry) {
      updateCase(
        currentCase.caseNumber,
        { absences: updatedEntries },
        {
          action: "updated",
          field: "absence",
          oldValue: getStatusLabel(oldEntry),
          newValue: `${editData.status}${editData.status.startsWith("OTH") && editData.otherName ? ` — ${editData.otherName}` : ""}`,
          description: `Updated absence entry from ${getStatusLabel(oldEntry)} to ${editData.status}`,
        },
      )
    }
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const getStatusLabel = (entry: AbsenceEntry) => {
    const option = statusOptions.find((o) => o.value === entry.status)
    if (entry.status.startsWith("OTH") && entry.otherName) {
      return `OTH — ${entry.otherName}`
    }
    return option?.label || entry.status
  }

  const handleEdit = (entry: AbsenceEntry) => {
    setEditingId(entry.id)
    setEditData({
      effectiveDate: entry.effectiveDate,
      endDate: entry.endDate || "",
      status: entry.status,
      reason: entry.reason || "",
      otherName: entry.otherName || "",
    })
  }

  // ===== RESTRICTIONS HANDLERS =====
  const employeeRestrictions = currentCase 
    ? getRestrictionsForEmployee(currentCase.employeeNumber)
    : []

  const filteredRestrictions = employeeRestrictions.filter((r) => {
    if (restrictionFilterActive === "active" && !r.isActive) return false
    if (restrictionFilterActive === "inactive" && r.isActive) return false
    if (restrictionFilterCase === "current" && r.caseNumber !== currentCase?.caseNumber) return false
    return true
  })

  const resetForm = () => {
    setFormData({
      restriction: "",
      startDate: "",
      endDate: "",
      reviewDate: "",
      isPermanent: false,
      isActive: true,
      notes: "",
    })
    setRestrictionEditingId(null)
  }

  const resetQuickEntry = () => {
    setQuickEntryData({
      restriction: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      reviewDate: "",
      isPermanent: false,
      isActive: true,
      notes: "",
    })
  }

  const handleQuickEntrySaveAndNew = () => {
    if (!quickEntryData.restriction || !quickEntryData.startDate || !currentCase) return
    addRestriction({
      ...quickEntryData,
      caseNumber: currentCase.caseNumber,
    })
    resetQuickEntry()
  }

  const handleQuickEntrySubmit = () => {
    if (!quickEntryData.restriction || !quickEntryData.startDate || !currentCase) return
    addRestriction({
      ...quickEntryData,
      caseNumber: currentCase.caseNumber,
    })
    resetQuickEntry()
  }

  const handleSubmit = () => {
    if (!formData.restriction || !formData.startDate || !currentCase) return

    if (restrictionEditingId) {
      updateRestriction(restrictionEditingId, formData)
    } else {
      addRestriction({
        ...formData,
        caseNumber: currentCase.caseNumber,
      })
    }

    resetForm()
    setShowDialog(false)
  }

  const handleRestrictionEdit = (restriction: Restriction) => {
    setFormData({
      restriction: restriction.restriction,
      startDate: restriction.startDate,
      endDate: restriction.endDate || "",
      reviewDate: restriction.reviewDate || "",
      isPermanent: restriction.isPermanent,
      isActive: restriction.isActive,
      notes: restriction.notes || "",
    })
    setRestrictionEditingId(restriction.id)
    setShowDialog(true)
  }

  const handleClone = (restriction: Restriction) => {
    setFormData({
      restriction: restriction.restriction,
      startDate: new Date().toISOString().split('T')[0],
      endDate: restriction.endDate || "",
      reviewDate: restriction.reviewDate || "",
      isPermanent: restriction.isPermanent,
      isActive: true,
      notes: restriction.notes || "",
    })
    setRestrictionEditingId(null)
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this restriction?")) {
      deleteRestriction(id)
    }
  }

  if (!currentCase) {
    return <div className="text-muted-foreground">No case selected</div>
  }

  return (
    <div className="space-y-8">
      {/* Absence Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-3">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Absence Tracking</h3>
        </div>
          <div className="grid grid-cols-3 gap-4 items-center bg-muted/30 py-3 px-4 rounded-lg">
            <div className="flex gap-2 items-center">
              <Label className="text-sm whitespace-nowrap">Status:</Label>
              <Select value={absenceFilterActive} onValueChange={(value: any) => setAbsenceFilterActive(value)}>
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Label className="text-sm whitespace-nowrap">Case:</Label>
              <Select value={absenceFilterCase} onValueChange={(value: any) => setAbsenceFilterCase(value)}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="current">Current Case Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              Showing {filteredAbsenceEntries.length} of {entries.length} entries
            </div>
          </div>

          {/* Audit Issues Section */}
          {auditIssues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Timeline Audit ({auditIssues.length} issue{auditIssues.length !== 1 ? "s" : ""})
              </div>
              <div className="space-y-2">
                {auditIssues.filter((i) => i.severity === "error").map((issue, idx) => (
                  <Alert key={`error-${idx}`} variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {issue.message}
                    </AlertDescription>
                  </Alert>
                ))}
                {auditIssues.filter((i) => i.severity === "warning").map((issue, idx) => (
                  <Alert key={`warning-${idx}`} className="py-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                      {issue.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">Cannot Add Entry</AlertTitle>
              <AlertDescription className="text-sm">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="effective-date" className="text-sm text-muted-foreground">
                Effective date:
              </Label>
              <Input
                id="effective-date"
                type="date"
                className="bg-background w-full"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-end-date" className="text-sm text-muted-foreground">
                End date:
              </Label>
              <Input
                id="absence-end-date"
                type="date"
                className="bg-background w-full"
                value={absenceEndDate}
                onChange={(e) => setAbsenceEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm text-muted-foreground">
                Status:
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status" className={`bg-background w-full ${selectedStatus.startsWith("RWD") && employeeRestrictions.length === 0 ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStatus.startsWith("RWD") && employeeRestrictions.length === 0 && (
                <p className="text-xs text-destructive">Restriction required for this status</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm text-muted-foreground">
                Reason:{selectedStatus.startsWith("OTH") && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger id="reason" className={`bg-background w-full ${selectedStatus.startsWith("OTH") && !selectedReason ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {codes.absenceReason
                    .filter((r) => r.active)
                    .map((reason) => (
                      <SelectItem key={reason.id} value={reason.code}>
                        {reason.description || reason.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="count-through" className="text-sm text-muted-foreground whitespace-nowrap">
                Count last status through:
              </Label>
              <Input
                id="count-through"
                type="date"
                className="bg-background w-full"
                value={countThrough}
                onChange={(e) => setCountThrough(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground invisible">Action</Label>
              <Button 
                onClick={handleAddEntry} 
                className="w-full"
                disabled={!effectiveDate || !selectedStatus || (selectedStatus.startsWith("OTH") && !selectedReason) || (selectedStatus.startsWith("RWD") && employeeRestrictions.length === 0)}
              >Add Entry</Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Days are counted from each effective date up to (but excluding) the next effective date. The last row counts
            through the date on the right (defaults to today).
          </p>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">FD</TableHead>
                  <TableHead className="text-center">LWD</TableHead>
                  <TableHead className="text-center">RWD</TableHead>
                  <TableHead className="text-center">RWDREGULARJOB</TableHead>
                  <TableHead className="text-center">OTH</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithDays.map((entry, index) => {
                  const hasError = auditIssues.some((i) => i.severity === "error" && i.entryIds.includes(entry.id))
                  const hasWarning = auditIssues.some((i) => i.severity === "warning" && i.entryIds.includes(entry.id))
                  return (
                  <TableRow 
                    key={entry.id}
                    className={hasError ? "bg-red-50 dark:bg-red-950/20" : hasWarning ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <Input
                          type="date"
                          value={editData.effectiveDate}
                          onChange={(e) => setEditData({ ...editData, effectiveDate: e.target.value })}
                          className="h-8"
                        />
                      ) : (
                        entry.effectiveDate
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <Input
                          type="date"
                          value={editData.endDate || ""}
                          onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                          className="h-8"
                        />
                      ) : (
                        entry.endDate || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <div className="flex gap-2">
                          <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {editData.status.startsWith("OTH") && (
                            <Input
                              value={editData.otherName}
                              onChange={(e) => setEditData({ ...editData, otherName: e.target.value })}
                              placeholder="Other name..."
                              className="h-8"
                            />
                          )}
                        </div>
                      ) : (
                        getStatusLabel(entry)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <Select value={editData.reason} onValueChange={(v) => setEditData({ ...editData, reason: v })}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {codes.absenceReason
                              .filter((r) => r.active)
                              .map((reason) => (
                                <SelectItem key={reason.id} value={reason.code}>
                                  {reason.description || reason.code}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        entry.reason || "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">{entry.days.FD}</TableCell>
                    <TableCell className="text-center">{entry.days.LWD}</TableCell>
                    <TableCell className="text-center">{entry.days.RWD}</TableCell>
                    <TableCell className="text-center">{entry.days.RWDREGULARJOB}</TableCell>
                    <TableCell className="text-center">{entry.days.OTH}</TableCell>
                    <TableCell>
                      {editingId === entry.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  )
                })}
                <TableRow className="font-medium bg-muted/50">
                  <TableCell colSpan={4} className="text-right">
                    Totals
                  </TableCell>
                  <TableCell className="text-center">{totals.FD}</TableCell>
                  <TableCell className="text-center">{totals.LWD}</TableCell>
                  <TableCell className="text-center">{totals.RWD}</TableCell>
                  <TableCell className="text-center">{totals.RWDREGULARJOB}</TableCell>
                  <TableCell className="text-center">{totals.OTH}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
      </div>

      {/* Restrictions Section */}
      <div className={`space-y-6 mt-20 p-4 rounded-lg ${selectedStatus.startsWith("RWD") && employeeRestrictions.length === 0 ? "border-2 border-destructive" : ""}`}>
        <div className="flex items-center gap-3 border-b pb-3">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Work Restrictions</h3>
          {selectedStatus.startsWith("RWD") && employeeRestrictions.length === 0 && (
            <span className="text-sm text-destructive ml-auto">Restriction required for selected status</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Restrictions for {currentCase.employeeName}</p>
            <div className="flex gap-2">
              <Button 
                variant={quickEntryMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setQuickEntryMode(!quickEntryMode)}
              >
                {quickEntryMode ? "Exit Quick Entry" : "Quick Entry Mode"}
              </Button>
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open)
                if (!open) resetForm()
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Restriction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{restrictionEditingId ? "Edit" : "Add"} Restriction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Restriction Type</Label>
                      <Select value={formData.restriction} onValueChange={(value) => setFormData({ ...formData, restriction: value })}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select restriction..." />
                        </SelectTrigger>
                        <SelectContent>
                          {restrictionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is-active" 
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                      />
                      <Label htmlFor="is-active" className="font-normal">
                        Currently Active
                      </Label>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input 
                          type="date" 
                          className="bg-background"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input 
                          type="date" 
                          className="bg-background"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          disabled={formData.isPermanent}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Review Date</Label>
                        <Input 
                          type="date" 
                          className="bg-background"
                          value={formData.reviewDate}
                          onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="permanent" 
                        checked={formData.isPermanent}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPermanent: checked as boolean, endDate: checked ? "" : formData.endDate })}
                      />
                      <Label htmlFor="permanent" className="font-normal">
                        Permanent Restriction
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        className="bg-background"
                        placeholder="Additional notes about this restriction..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} disabled={!formData.restriction || !formData.startDate}>
                        {restrictionEditingId ? "Update" : "Add"} Restriction
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg">
            <div className="flex gap-2 items-center">
              <Label className="text-sm">Status:</Label>
              <Select value={restrictionFilterActive} onValueChange={(value: any) => setRestrictionFilterActive(value)}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Label className="text-sm">Case:</Label>
              <Select value={restrictionFilterCase} onValueChange={(value: any) => setRestrictionFilterCase(value)}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="current">Current Case Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredRestrictions.length} of {employeeRestrictions.length} restrictions
            </div>
          </div>

          {/* Restrictions Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Restriction</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quickEntryMode && (
                  <TableRow className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
                    <TableCell>
                      <Checkbox 
                        checked={quickEntryData.isActive}
                        onCheckedChange={(checked) => setQuickEntryData({ ...quickEntryData, isActive: checked as boolean })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={quickEntryData.restriction} 
                        onValueChange={(value) => setQuickEntryData({ ...quickEntryData, restriction: value })}
                      >
                        <SelectTrigger className="bg-background h-9">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {restrictionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {currentCase.caseNumber}
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="date"
                        className="bg-background h-9"
                        value={quickEntryData.startDate}
                        onChange={(e) => setQuickEntryData({ ...quickEntryData, startDate: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="date"
                        className="bg-background h-9"
                        value={quickEntryData.endDate}
                        onChange={(e) => setQuickEntryData({ ...quickEntryData, endDate: e.target.value })}
                        disabled={quickEntryData.isPermanent}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="date"
                        className="bg-background h-9"
                        value={quickEntryData.reviewDate}
                        onChange={(e) => setQuickEntryData({ ...quickEntryData, reviewDate: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        className="bg-background h-9"
                        placeholder="Notes..."
                        value={quickEntryData.notes}
                        onChange={(e) => setQuickEntryData({ ...quickEntryData, notes: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleQuickEntrySaveAndNew}
                          disabled={!quickEntryData.restriction || !quickEntryData.startDate}
                          title="Save and add new (Tab here to continue)"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleQuickEntrySubmit}
                          disabled={!quickEntryData.restriction || !quickEntryData.startDate}
                          title="Save restriction"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={resetQuickEntry}
                          title="Clear fields"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredRestrictions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No restrictions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestrictions.map((restriction) => (
                    <TableRow key={restriction.id}>
                      <TableCell>
                        <Badge variant={restriction.isActive ? "default" : "secondary"}>
                          {restriction.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getRestrictionDisplayName(restriction.restriction)}
                        {restriction.isPermanent && (
                          <Badge variant="outline" className="ml-2">Permanent</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {restriction.caseNumber}
                          {restriction.caseNumber === currentCase.caseNumber && (
                            <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{restriction.startDate}</TableCell>
                      <TableCell>{restriction.endDate || "—"}</TableCell>
                      <TableCell>{restriction.reviewDate || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{restriction.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleClone(restriction)} title="Clone restriction">
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRestrictionEdit(restriction)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(restriction.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </div>
    </div>
  )
}

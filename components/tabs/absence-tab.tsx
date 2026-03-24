"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Save, X } from "lucide-react"
import { useCases } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { debug } from "@/lib/debug"

interface AbsenceEntry {
  id: string
  effectiveDate: string
  status: "FD" | "LWD" | "RWD" | "RWDREGULARJOB" | "OTH"
  reason?: string
  otherName?: string
  createdSeq: number
  isActive?: boolean
  caseNumber?: string
}

const statusOptions = [
  { value: "FD", label: "Full Duty" },
  { value: "LWD", label: "Lost Work Days" },
  { value: "OTH", label: "Other" },
  { value: "RWD", label: "Restricted Work Days" },
  { value: "RWDREGULARJOB", label: "OSHA Full Duty (Restrictions, no job impact)" },
]

export function AbsenceTab() {
  const { currentCase, updateCase } = useCases()
  const { codes } = useAdmin()

  const [entries, setEntries] = useState<AbsenceEntry[]>([])

  const [effectiveDate, setEffectiveDate] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [otherName, setOtherName] = useState("")
  const [countThrough, setCountThrough] = useState(new Date().toISOString().split("T")[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ effectiveDate: string; status: string; reason: string; otherName: string }>({
    effectiveDate: "",
    status: "",
    reason: "",
    otherName: "",
  })

  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [filterCase, setFilterCase] = useState<"all" | "current">("all")

  useEffect(() => {
    if (currentCase?.absences) {
      setEntries(currentCase.absences)
    }
  }, [currentCase])

  const calculateDays = (entry: AbsenceEntry, nextDate: string) => {
    const start = new Date(entry.effectiveDate.replace(/-/g, "/"))
    const end = new Date(nextDate.replace(/-/g, "/"))

    debug("Calculating days:", {
      from: entry.effectiveDate,
      to: nextDate,
      start: start.toISOString(),
      end: end.toISOString(),
    })

    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    debug("Calculated days:", diffDays)

    return diffDays > 0 ? diffDays : 0
  }

  const getStatusCode = (status: string): string => {
    // Extract code from "CODE — Description" format
    const match = status.match(/^([A-Z]+)/)
    return match ? match[1] : status
  }

  const filteredEntries = entries.filter((entry) => {
    // Filter by active status (entries don't have isActive yet, future enhancement)
    // Filter by case (entries don't have caseNumber yet, future enhancement)
    return true // For now, show all
  })

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateCompare = a.effectiveDate.localeCompare(b.effectiveDate)
    return dateCompare !== 0 ? dateCompare : a.createdSeq - b.createdSeq
  })

  const entriesWithDays = sortedEntries.map((entry, index) => {
    const nextDate = index < sortedEntries.length - 1 ? sortedEntries[index + 1].effectiveDate : countThrough

    debug("Processing entry:", {
      index,
      effectiveDate: entry.effectiveDate,
      nextDate,
      status: entry.status,
    })

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

  const handleAddEntry = () => {
    if (!effectiveDate || !selectedStatus) return
    if (selectedStatus === "OTH" && !otherName) return

    const newEntry: AbsenceEntry = {
      id: Date.now().toString(),
      effectiveDate,
      status: selectedStatus as AbsenceEntry["status"],
      reason: selectedReason || undefined,
      otherName: selectedStatus === "OTH" ? otherName : undefined,
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
    setSelectedStatus("")
    setSelectedReason("")
    setOtherName("")
  }

  const handleSave = () => {
    if (!editData.effectiveDate || !editData.status) return
    if (editData.status === "OTH" && !editData.otherName) return

    const oldEntry = entries.find((e) => e.id === editingId)
    const updatedEntries = entries.map((e) =>
      e.id === editingId
        ? {
            ...e,
            effectiveDate: editData.effectiveDate,
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
          newValue: `${editData.status}${editData.status === "OTH" && editData.otherName ? ` — ${editData.otherName}` : ""}`,
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
    if (entry.status === "OTH" && entry.otherName) {
      return `OTH — ${entry.otherName}`
    }
    return option?.label || entry.status
  }

  const handleEdit = (entry: AbsenceEntry) => {
    setEditingId(entry.id)
    setEditData({
      effectiveDate: entry.effectiveDate,
      status: entry.status,
      reason: entry.reason || "",
      otherName: entry.otherName || "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg">
        <div className="flex gap-2 items-center">
          <Label className="text-sm">Status:</Label>
          <Select value={filterActive} onValueChange={(value: any) => setFilterActive(value)}>
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
          <Select value={filterCase} onValueChange={(value: any) => setFilterCase(value)}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="current">Current Case Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} entries
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="effective-date" className="text-sm text-muted-foreground">
            Effective date:
          </Label>
          <Input
            id="effective-date"
            type="date"
            className="bg-background"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm text-muted-foreground">
            Status:
          </Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status" className="bg-background">
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm text-muted-foreground">
            Reason:
          </Label>
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger id="reason" className="bg-background">
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
        {selectedStatus === "OTH" && (
          <div className="space-y-2">
            <Label htmlFor="other-name" className="text-sm text-muted-foreground">
              Other name:
            </Label>
            <Input
              id="other-name"
              className="bg-background"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              placeholder="Enter other name..."
            />
          </div>
        )}
        <div className="flex gap-2 items-end">
          <Button onClick={handleAddEntry}>Add Entry</Button>
          <div className="flex-1 space-y-2">
            <Label htmlFor="count-through" className="text-sm text-muted-foreground whitespace-nowrap">
              Count last status through:
            </Label>
            <Input
              id="count-through"
              type="date"
              className="bg-background"
              value={countThrough}
              onChange={(e) => setCountThrough(e.target.value)}
            />
          </div>
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
            {entriesWithDays.map((entry, index) => (
              <TableRow key={entry.id}>
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
                      {editData.status === "OTH" && (
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
            ))}
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
  )
}

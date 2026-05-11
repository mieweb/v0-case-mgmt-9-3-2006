"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useCases, type Diagnosis } from "@/contexts/cases-context"
import { useUser } from "@/contexts/user-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowUp, ArrowDown, Trash2, Edit, GripVertical, Loader2, Search } from "lucide-react"
import { debug } from "@/lib/debug"

interface ICD10Code {
  code: string
  description: string
}

export function DiagnosisTab() {
  const { currentCase, updateCase } = useCases()
  const { currentUser } = useUser()
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [filterCase, setFilterCase] = useState<"all" | "current">("current")
  const [isAddingDiagnosis, setIsAddingDiagnosis] = useState(false)
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Form state
  const [customCode, setCustomCode] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [isActive, setIsActive] = useState(true)

  // ICD-10 search state
  const [icd10SearchResults, setIcd10SearchResults] = useState<ICD10Code[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Debounced ICD-10 search
  const searchICD10 = useCallback(async (query: string) => {
    if (query.length < 2) {
      setIcd10SearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/icd10?q=${encodeURIComponent(query)}&maxList=15`)
      const data = await response.json()
      setIcd10SearchResults(data.results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error("ICD-10 search error:", error)
      setIcd10SearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customCode) {
        searchICD10(customCode)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [customCode, searchICD10])

  const handleSelectICD10 = (code: ICD10Code) => {
    setCustomCode(code.code)
    setCustomDescription(code.description)
    setShowSearchResults(false)
  }

  const diagnoses = currentCase?.diagnoses || []

  // Filter diagnoses
  const filteredDiagnoses = diagnoses.filter((diag) => {
    if (filterActive === "active" && !diag.isActive) return false
    if (filterActive === "inactive" && diag.isActive) return false
    if (filterCase === "current" && diag.caseNumber !== currentCase?.caseNumber) return false
    return true
  })

  const sortedDiagnoses = [...filteredDiagnoses].sort((a, b) => a.priority - b.priority)

  const resetForm = () => {
    setCustomCode("")
    setCustomDescription("")
    setDiagnosisDate(new Date().toISOString().split("T")[0])
    setNotes("")
    setIsActive(true)
    setEditingDiagnosis(null)
    setIcd10SearchResults([])
    setShowSearchResults(false)
  }

  const handleAddOrEditDiagnosis = () => {
    if (!currentCase || !currentUser) return

    const icd10Code = customCode
    const icd10Description = customDescription

    if (!icd10Code || !diagnosisDate) {
      alert("Please enter an ICD-10 code and diagnosis date")
      return
    }

    if (editingDiagnosis) {
      // Edit existing diagnosis
      const updatedDiagnoses = diagnoses.map((diag) =>
        diag.id === editingDiagnosis.id
          ? {
              ...diag,
              icd10Code,
              icd10Description,
              diagnosisDate,
              notes,
              isActive,
            }
          : diag,
      )

      updateCase(
        currentCase.caseNumber,
        { diagnoses: updatedDiagnoses },
        {
          action: "updated",
          field: "diagnosis",
          description: `Updated diagnosis: ${icd10Code} - ${icd10Description}`,
        },
      )

      debug("[v0] Diagnosis updated:", editingDiagnosis.id)
    } else {
      // Add new diagnosis
      const newDiagnosis: Diagnosis = {
        id: `diag-${Date.now()}`,
        caseNumber: currentCase.caseNumber,
        icd10Code,
        icd10Description,
        diagnosisDate,
        priority: diagnoses.length + 1,
        isActive,
        notes,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      }

      updateCase(
        currentCase.caseNumber,
        { diagnoses: [...diagnoses, newDiagnosis] },
        {
          action: "added",
          field: "diagnosis",
          description: `Added diagnosis: ${icd10Code} - ${icd10Description}`,
        },
      )

      debug("[v0] Diagnosis added:", newDiagnosis)
    }

    setIsAddingDiagnosis(false)
    resetForm()
  }

  const handleDeleteDiagnosis = (diagnosisId: string) => {
    if (!currentCase) return

    const diagnosisToDelete = diagnoses.find((d) => d.id === diagnosisId)
    if (!diagnosisToDelete) return

    if (!confirm(`Are you sure you want to delete this diagnosis?`)) return

    const updatedDiagnoses = diagnoses.filter((d) => d.id !== diagnosisId)
    // Reorder priorities
    const reorderedDiagnoses = updatedDiagnoses.map((diag, index) => ({
      ...diag,
      priority: index + 1,
    }))

    updateCase(
      currentCase.caseNumber,
      { diagnoses: reorderedDiagnoses },
      {
        action: "removed",
        field: "diagnosis",
        description: `Removed diagnosis: ${diagnosisToDelete.icd10Code} - ${diagnosisToDelete.icd10Description}`,
      },
    )

    debug("[v0] Diagnosis deleted:", diagnosisId)
  }

  const handleMovePriority = (diagnosisId: string, direction: "up" | "down") => {
    if (!currentCase) return

    const currentIndex = sortedDiagnoses.findIndex((d) => d.id === diagnosisId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sortedDiagnoses.length) return

    // Swap priorities
    const updatedDiagnoses = diagnoses.map((diag) => {
      if (diag.id === sortedDiagnoses[currentIndex].id) {
        return { ...diag, priority: newIndex + 1 }
      }
      if (diag.id === sortedDiagnoses[newIndex].id) {
        return { ...diag, priority: currentIndex + 1 }
      }
      return diag
    })

    updateCase(
      currentCase.caseNumber,
      { diagnoses: updatedDiagnoses },
      {
        action: "updated",
        field: "diagnosis priority",
        description: `Changed priority for ${sortedDiagnoses[currentIndex].icd10Code}`,
      },
    )

    debug("[v0] Diagnosis priority changed:", diagnosisId, direction)
  }

  const handleEditClick = (diagnosis: Diagnosis) => {
    setEditingDiagnosis(diagnosis)
    setSelectedCode(`${diagnosis.icd10Code} - ${diagnosis.icd10Description}`)
    setCustomCode(diagnosis.icd10Code)
    setCustomDescription(diagnosis.icd10Description)
    setDiagnosisDate(diagnosis.diagnosisDate)
    setNotes(diagnosis.notes || "")
    setIsActive(diagnosis.isActive)
    setIsAddingDiagnosis(true)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!currentCase || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    // Reorder the diagnoses
    const reorderedDiagnoses = [...sortedDiagnoses]
    const [draggedItem] = reorderedDiagnoses.splice(draggedIndex, 1)
    reorderedDiagnoses.splice(dropIndex, 0, draggedItem)

    // Update priorities
    const updatedDiagnoses = diagnoses.map((diag) => {
      const newIndex = reorderedDiagnoses.findIndex((d) => d.id === diag.id)
      return newIndex !== -1 ? { ...diag, priority: newIndex + 1 } : diag
    })

    updateCase(
      currentCase.caseNumber,
      { diagnoses: updatedDiagnoses },
      {
        action: "updated",
        field: "diagnosis priority",
        description: `Reordered diagnosis: ${draggedItem.icd10Code}`,
      },
    )

    setDraggedIndex(null)
    setDragOverIndex(null)
    debug("[v0] Diagnoses reordered via drag-drop")
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (!currentCase) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Please select a case to view diagnosis information.</p>
      </div>
    )
  }

  return (
    <div className="diagnosis-tab-container space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Diagnosis Information</h3>
        <Button size="sm" onClick={() => setIsAddingDiagnosis(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Diagnosis
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg flex-wrap">
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
          Showing {filteredDiagnoses.length} of {diagnoses.length} diagnoses
        </div>
      </div>

      {/* Diagnoses Table */}
      <div className="diagnosis-list border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[80px]">Priority</TableHead>
              <TableHead>ICD-10 Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Diagnosis Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDiagnoses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No diagnoses found. Click "Add Diagnosis" to get started.
                </TableCell>
              </TableRow>
            ) : (
              sortedDiagnoses.map((diagnosis, index) => (
                <TableRow
                  key={diagnosis.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-colors ${draggedIndex === index ? "opacity-50" : ""} ${
                    dragOverIndex === index && draggedIndex !== index ? "border-t-2 border-t-primary" : ""
                  }`}
                >
                  <TableCell className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={diagnosis.priority === 1 ? "default" : "secondary"}>
                        {diagnosis.priority === 1 ? "Primary" : `#${diagnosis.priority}`}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{diagnosis.icd10Code}</TableCell>
                  <TableCell>{diagnosis.icd10Description}</TableCell>
                  <TableCell>{(() => { const d = new Date(diagnosis.diagnosisDate); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`; })()}</TableCell>
                  <TableCell>
                    <Badge variant={diagnosis.isActive ? "default" : "secondary"}>
                      {diagnosis.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{diagnosis.notes || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMovePriority(diagnosis.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMovePriority(diagnosis.id, "down")}
                        disabled={index === sortedDiagnoses.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditClick(diagnosis)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteDiagnosis(diagnosis.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Diagnosis Dialog */}
      <Dialog open={isAddingDiagnosis} onOpenChange={setIsAddingDiagnosis}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDiagnosis ? "Edit Diagnosis" : "Add Diagnosis"}</DialogTitle>
            <DialogDescription>
              {editingDiagnosis
                ? "Update the diagnosis information below."
                : "Select or enter an ICD-10 code and provide diagnosis details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* ICD-10 Code Search */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label>ICD-10 Code *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customCode}
                    onChange={(e) => {
                      setCustomCode(e.target.value.toUpperCase())
                      if (e.target.value.length < 2) {
                        setCustomDescription("")
                      }
                    }}
                    onFocus={() => {
                      if (icd10SearchResults.length > 0) setShowSearchResults(true)
                    }}
                    onBlur={() => {
                      // Delay to allow click on search result
                      setTimeout(() => setShowSearchResults(false), 200)
                    }}
                    placeholder="Search ICD-10 code or description..."
                    className="font-mono pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {/* Search Results Dropdown */}
                {showSearchResults && icd10SearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {icd10SearchResults.map((result) => (
                      <button
                        key={result.code}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2 border-b last:border-b-0"
                        onClick={() => handleSelectICD10(result)}
                      >
                        <span className="font-mono font-semibold text-primary shrink-0">{result.code}</span>
                        <span className="text-sm text-muted-foreground truncate">{result.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showSearchResults && icd10SearchResults.length === 0 && customCode.length >= 2 && !isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                    No ICD-10 codes found. You can enter a custom code and description.
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Auto-populated from ICD-10 lookup"
                  className="bg-muted/30"
                />
              </div>
            </div>

            {/* Diagnosis Date */}
            <div className="space-y-2">
              <Label>Diagnosis Date *</Label>
              <Input type="date" value={diagnosisDate} onChange={(e) => setDiagnosisDate(e.target.value)} />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this diagnosis..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingDiagnosis(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddOrEditDiagnosis}>
                {editingDiagnosis ? "Update Diagnosis" : "Add Diagnosis"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

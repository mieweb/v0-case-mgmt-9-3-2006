"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCases, Restriction } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function RestrictionsTab() {
  const { currentCase, restrictions, addRestriction, updateRestriction, deleteRestriction, getRestrictionsForEmployee, updateCase } = useCases()
  const { codes } = useAdmin()
  
  // Get active restriction codes from admin, showing description (name) as the display value
  const restrictionOptions = codes.restrictionCodes
    .filter((c) => c.active)
    .map((c) => ({ value: c.code, label: c.description || c.code }))

  // Helper to resolve a restriction code to its display name
  const getRestrictionDisplayName = (code: string) => {
    const found = codes.restrictionCodes.find((c) => c.code === code)
    return found?.description || code
  }
  
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Filter states
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [filterCase, setFilterCase] = useState<"all" | "current">("all")
  
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

  // Form states
  const [formData, setFormData] = useState({
    restriction: "",
    startDate: "",
    endDate: "",
    reviewDate: "",
    isPermanent: false,
    isActive: true,
    notes: "",
  })

  // Get all restrictions for this employee
  const employeeRestrictions = currentCase 
    ? getRestrictionsForEmployee(currentCase.employeeNumber)
    : []

  // Apply filters
  const filteredRestrictions = employeeRestrictions.filter((r) => {
    // Filter by active status
    if (filterActive === "active" && !r.isActive) return false
    if (filterActive === "inactive" && r.isActive) return false
    
    // Filter by case
    if (filterCase === "current" && r.caseNumber !== currentCase?.caseNumber) return false
    
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
    setEditingId(null)
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

  // Helper function to add a review todo when a review date is entered
  const addReviewTodoIfNeeded = (restrictionName: string, reviewDate: string) => {
    if (!reviewDate || !currentCase) return

    const newTodo = {
      id: `todo-${Date.now()}`,
      dateScheduled: reviewDate,
      activity: `Review Permanent Restriction - ${restrictionName}`,
      caseManager: currentCase.caseManager || "",
      completed: false,
    }

    const updatedTodos = [...(currentCase.todos || []), newTodo]
    updateCase(currentCase.caseNumber, { todos: updatedTodos })
  }

  const handleQuickEntrySaveAndNew = () => {
    if (!quickEntryData.restriction || !quickEntryData.startDate || !currentCase) return

    addRestriction({
      ...quickEntryData,
      caseNumber: currentCase.caseNumber,
    })

    // Add review todo if review date is entered
    addReviewTodoIfNeeded(quickEntryData.restriction, quickEntryData.reviewDate)

    // Reset for next entry
    resetQuickEntry()
  }

  const handleQuickEntrySubmit = () => {
    if (!quickEntryData.restriction || !quickEntryData.startDate || !currentCase) return

    addRestriction({
      ...quickEntryData,
      caseNumber: currentCase.caseNumber,
    })

    // Add review todo if review date is entered
    addReviewTodoIfNeeded(quickEntryData.restriction, quickEntryData.reviewDate)

    resetQuickEntry()
  }

  const handleSubmit = () => {
    if (!formData.restriction || !formData.startDate || !currentCase) return

    if (editingId) {
      updateRestriction(editingId, formData)
    } else {
      addRestriction({
        ...formData,
        caseNumber: currentCase.caseNumber,
      })
      
      // Add review todo if review date is entered (only for new restrictions)
      addReviewTodoIfNeeded(formData.restriction, formData.reviewDate)
    }

    resetForm()
    setShowDialog(false)
  }

  const handleEdit = (restriction: Restriction) => {
    setFormData({
      restriction: restriction.restriction,
      startDate: restriction.startDate,
      endDate: restriction.endDate || "",
      reviewDate: restriction.reviewDate || "",
      isPermanent: restriction.isPermanent,
      isActive: restriction.isActive,
      notes: restriction.notes || "",
    })
    setEditingId(restriction.id)
    setShowDialog(true)
  }

  const handleClone = (restriction: Restriction) => {
    setFormData({
      restriction: restriction.restriction,
      startDate: new Date().toISOString().split('T')[0], // Set to today
      endDate: restriction.endDate || "",
      reviewDate: restriction.reviewDate || "",
      isPermanent: restriction.isPermanent,
      isActive: true, // Default to active for new restriction
      notes: restriction.notes || "",
    })
    setEditingId(null) // Not editing, creating new
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Work Restrictions for {currentCase.employeeName}</h3>
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
                <DialogTitle>{editingId ? "Edit" : "Add"} Restriction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex items-end space-x-2 pb-2">
                    <Checkbox 
                      id="is-active" 
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                    />
                    <Label htmlFor="is-active" className="font-normal">
                      Currently Active
                    </Label>
                  </div>
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
                    {editingId ? "Update" : "Add"} Restriction
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
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(restriction)}>
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
  )
}

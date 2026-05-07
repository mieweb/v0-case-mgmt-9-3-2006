"use client"

import { useEffect } from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Pencil,
  Trash2,
  List,
  LayoutList,
  AlertCircle,
  Lock,
  Unlock,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CalendarDays,
  ShieldAlert,
  ListTodo,
} from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useCases, type CaseNote, type CaseNoteVersion, type AbsenceEntry } from "@/contexts/cases-context"
import { NoteWindow, MinimizedNoteWindow } from "@/components/note-window"
import { useUser } from "@/contexts/user-context"
import { useAdmin } from "@/contexts/admin-context"
import { computeDiff, renderDiff } from "@/lib/diff-utils"

export function CaseNotesTab() {
  const { currentCase, updateCase, addRestriction } = useCases()
  const { currentUser } = useUser()
  const { codes, getCaseType, caseManagers } = useAdmin()
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [editingNote, setEditingNote] = useState<CaseNote | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "detail">("list")
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [selectedNoteForHistory, setSelectedNoteForHistory] = useState<CaseNote | null>(null)
  const [diffMode, setDiffMode] = useState(false)
  const [compareVersionIndex, setCompareVersionIndex] = useState(0) // Index of the older version to compare

  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split("T")[0])
  const [activity, setActivity] = useState("")
  const [content, setContent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [noteCaseManager, setNoteCaseManager] = useState(currentCase?.caseManager || "")
  const [validationError, setValidationError] = useState<string>("")

  const isAdmin = currentUser?.role === "admin"

  // Quick Absence entry state
  const [showQuickAbsence, setShowQuickAbsence] = useState(false)
  const [absenceDate, setAbsenceDate] = useState("")
  const [absenceStatus, setAbsenceStatus] = useState("")
  const [absenceOtherName, setAbsenceOtherName] = useState("")
  const [quickAbsenceAdded, setQuickAbsenceAdded] = useState<{ date: string; status: string }[]>([])

  // Quick Restriction entry state
  const [showQuickRestriction, setShowQuickRestriction] = useState(false)
  const [restrictionType, setRestrictionType] = useState("")
  const [restrictionStartDate, setRestrictionStartDate] = useState(() => new Date().toISOString().split("T")[0])
  const [restrictionEndDate, setRestrictionEndDate] = useState("")
  const [restrictionPermanent, setRestrictionPermanent] = useState(false)
  const [restrictionNotes, setRestrictionNotes] = useState("")
  const [quickRestrictionAdded, setQuickRestrictionAdded] = useState<string[]>([])

  // Quick To-Do entry state
  const [showQuickTodo, setShowQuickTodo] = useState(false)
  const [todoActivity, setTodoActivity] = useState("")
  const [todoDateScheduled, setTodoDateScheduled] = useState("")
  const [quickTodoAdded, setQuickTodoAdded] = useState<string[]>([])

  const absenceStatusOptions = [
    { value: "FD", label: "FD -- Full Duty" },
    { value: "LWD", label: "LWD -- Lost Work Days" },
    { value: "RWD", label: "RWD -- Restricted Work Days" },
    { value: "RWDREGULARJOB", label: "RWDREGULARJOB -- OSHA Full Duty" },
    { value: "OTH", label: "OTH -- Other" },
  ]

  const restrictionOptions = [
    "No Lifting Over 25 lbs",
    "No Lifting Over 50 lbs",
    "No Prolonged Standing",
    "No Climbing",
    "No Repetitive Motion",
    "Light Duty Only",
    "Sedentary Work Only",
    "No Overhead Work",
    "No Bending/Stooping",
    "Limited Hours (4 hours/day)",
    "Limited Hours (6 hours/day)",
  ]

  useEffect(() => {
    if (currentCase?.caseNotes) {
      setNotes(currentCase.caseNotes)
    } else {
      setNotes([])
    }
  }, [currentCase?.caseNumber])

  const handleCreateNote = () => {
    setEditingNote(null)
    setNoteDate(new Date().toISOString().split("T")[0])
    setActivity("")
    setContent("")
    setSelectedTemplate("")
    setNoteCaseManager(currentCase?.caseManager || "")
    setValidationError("")
    setIsDialogOpen(true)
    setIsMinimized(false)
  }

  const handleEditNote = (note: CaseNote) => {
    if (note.isLocked && !isAdmin) {
      setValidationError("This note is locked and can only be edited by an administrator.")
      return
    }

    setEditingNote(note)
    setNoteDate(note.noteDate)
    setActivity(note.activity)
    setContent(note.notes)
    setValidationError("")
    setIsDialogOpen(true)
    setIsMinimized(false)
  }

  const handleSaveNoteAction = () => {
    if (!currentCase || !content || !activity) {
      const missingFields = []
      if (!activity) missingFields.push("Activity")
      if (!content) missingFields.push("Notes")

      setValidationError(
        `Please fill in the required field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}`,
      )
      return
    }

    const now = new Date().toISOString()
    const userName = currentUser?.name || currentCase.caseManager

    if (editingNote) {
      const newVersion: CaseNoteVersion = {
        id: `version-${Date.now()}`,
        content: editingNote.notes,
        editedBy: editingNote.caseManager,
        editedAt: editingNote.dateEntered,
      }

      const updatedNote: CaseNote = {
        ...editingNote,
        noteDate,
        activity,
        notes: content,
        versions: [...(editingNote.versions || []), newVersion],
        currentVersion: (editingNote.currentVersion || 0) + 1,
      }

      const updatedNotes = notes.map((n) => (n.id === editingNote.id ? updatedNote : n))
      setNotes(updatedNotes)
      updateCase(
        currentCase.caseNumber,
        { caseNotes: updatedNotes },
        {
          action: "updated",
          field: "case note",
          oldValue: `v${editingNote.currentVersion}`,
          newValue: `v${updatedNote.currentVersion}`,
          description: `Updated case note (v${updatedNote.currentVersion}): ${activity}`,
        },
      )
    } else {
      const newNote: CaseNote = {
        id: `note-${Date.now()}`,
        caseNumber: currentCase.caseNumber,
        noteDate,
        activity,
        caseManager: noteCaseManager || userName,
        notes: content,
        createdBy: userName,
        dateEntered: now,
        lineout: false,
        isLocked: false,
        versions: [],
        currentVersion: 1,
      }
      const updatedNotes = [...notes, newNote]
      setNotes(updatedNotes)
      updateCase(
        currentCase.caseNumber,
        { caseNotes: updatedNotes },
        {
          action: "added",
          field: "case note",
          newValue: activity,
          description: `Added case note: ${activity}`,
        },
      )
    }

    setValidationError("")
    setIsDialogOpen(false)
  }

  const handleToggleLock = (note: CaseNote) => {
    if (!isAdmin) {
      alert("Only administrators can lock or unlock notes.")
      return
    }

    const updatedNote: CaseNote = {
      ...note,
      isLocked: !note.isLocked,
      lockedBy: !note.isLocked ? currentUser?.name : undefined,
      lockedAt: !note.isLocked ? new Date().toISOString() : undefined,
    }

    const updatedNotes = notes.map((n) => (n.id === note.id ? updatedNote : n))
    setNotes(updatedNotes)

    if (currentCase) {
      updateCase(
        currentCase.caseNumber,
        { caseNotes: updatedNotes },
        {
          action: "updated",
          field: "case note lock",
          oldValue: note.isLocked ? "locked" : "unlocked",
          newValue: updatedNote.isLocked ? "locked" : "unlocked",
          description: `${updatedNote.isLocked ? "Locked" : "Unlocked"} case note: ${note.activity}`,
        },
      )
    }
  }

  const handleShowVersionHistory = (note: CaseNote) => {
    setSelectedNoteForHistory(note)
    setShowVersionHistory(true)
    setDiffMode(false)
    setCompareVersionIndex(0)
  }

  const handlePreviousDiff = () => {
    if (selectedNoteForHistory && compareVersionIndex < selectedNoteForHistory.versions.length) {
      setCompareVersionIndex(compareVersionIndex + 1)
    }
  }

  const handleNextDiff = () => {
    if (compareVersionIndex > 0) {
      setCompareVersionIndex(compareVersionIndex - 1)
    }
  }

  const getDiffContent = () => {
    if (!selectedNoteForHistory || !diffMode) return null

    const versions = selectedNoteForHistory.versions

    if (!versions || versions.length === 0) return null

    if (compareVersionIndex === 0) {
      const oldVersion = versions[versions.length - 1]
      if (!oldVersion) return null

      const diff = computeDiff(oldVersion.content, selectedNoteForHistory.notes)
      return {
        oldVersionNumber: selectedNoteForHistory.currentVersion - 1,
        newVersionNumber: selectedNoteForHistory.currentVersion,
        oldDate: oldVersion.editedAt,
        newDate: selectedNoteForHistory.dateEntered,
        oldEditor: oldVersion.editedBy,
        newEditor: selectedNoteForHistory.caseManager,
        diffHtml: renderDiff(diff),
      }
    } else {
      const oldVersionIndex = versions.length - compareVersionIndex - 1
      const newVersionIndex = versions.length - compareVersionIndex

      if (oldVersionIndex < 0 || newVersionIndex >= versions.length) return null

      const oldVersion = versions[oldVersionIndex]
      const newVersion = versions[newVersionIndex]

      if (!oldVersion || !newVersion) return null

      const diff = computeDiff(oldVersion.content, newVersion.content)
      return {
        oldVersionNumber: selectedNoteForHistory.currentVersion - compareVersionIndex - 1,
        newVersionNumber: selectedNoteForHistory.currentVersion - compareVersionIndex,
        oldDate: oldVersion.editedAt,
        newDate: newVersion.editedAt,
        oldEditor: oldVersion.editedBy,
        newEditor: newVersion.editedBy,
        diffHtml: renderDiff(diff),
      }
    }
  }

  const handleDeleteNote = (id: string) => {
    const note = notes.find((n) => n.id === id)

    if (note?.isLocked && !isAdmin) {
      alert("This note is locked and cannot be deleted.")
      return
    }

    if (!note) return

    // Soft delete - mark as lineout instead of removing
    const updatedNote: CaseNote = {
      ...note,
      lineout: true,
      deletedBy: currentUser?.name || currentCase?.caseManager,
      deletedAt: new Date().toISOString(),
    }

    const updatedNotes = notes.map((n) => (n.id === id ? updatedNote : n))
    setNotes(updatedNotes)
    if (currentCase) {
      updateCase(
        currentCase.caseNumber,
        { caseNotes: updatedNotes },
        {
          action: "removed",
          field: "case note",
          oldValue: note.activity,
          description: `Deleted case note: ${note.activity}`,
        },
      )
    }
  }

  const handleQuickAddAbsence = () => {
    if (!currentCase || !absenceDate || !absenceStatus) return
    if (absenceStatus === "OTH" && !absenceOtherName) return

    const existingAbsences = currentCase.absences || []
    const statusLabel = absenceStatusOptions.find((o) => o.value === absenceStatus)?.label || absenceStatus

    const newEntry = {
      id: Date.now().toString(),
      effectiveDate: absenceDate,
      status: statusLabel,
      statusType: absenceStatus as "FD" | "LWD" | "RWD" | "RWDREGULARJOB" | "OTH",
      customOthName: absenceStatus === "OTH" ? absenceOtherName : undefined,
      createdSeq: Math.max(...existingAbsences.map((e: any) => e.createdSeq || 0), 0) + 1,
      days: { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0 },
    }

    const updatedAbsences = [...existingAbsences, newEntry]
    updateCase(
      currentCase.caseNumber,
      { absences: updatedAbsences },
      {
        action: "added",
        field: "absence",
        newValue: `${absenceStatus} on ${absenceDate}`,
        description: `Added absence entry from Case Notes: ${absenceStatus} on ${absenceDate}`,
      },
    )

    setQuickAbsenceAdded((prev) => [...prev, { date: absenceDate, status: absenceStatus }])
    setAbsenceDate("")
    setAbsenceStatus("")
    setAbsenceOtherName("")
  }

  const handleQuickAddRestriction = () => {
    if (!currentCase || !restrictionType || !restrictionStartDate) return

    addRestriction({
      restriction: restrictionType,
      startDate: restrictionStartDate,
      endDate: restrictionEndDate || undefined,
      isPermanent: restrictionPermanent,
      isActive: true,
      notes: restrictionNotes || undefined,
      caseNumber: currentCase.caseNumber,
    })

    setQuickRestrictionAdded((prev) => [...prev, restrictionType])
    setRestrictionType("")
    setRestrictionStartDate(new Date().toISOString().split("T")[0])
    setRestrictionEndDate("")
    setRestrictionPermanent(false)
    setRestrictionNotes("")
  }

  const handleQuickAddTodo = () => {
    if (!currentCase || !todoActivity) return

    const existingTodos = currentCase.todos || []
    const newTodo = {
      id: `todo-${Date.now()}`,
      activity: todoActivity,
      dateScheduled: todoDateScheduled || undefined,
      caseManager: currentCase.caseManager,
      completed: false,
    }

    const updatedTodos = [...existingTodos, newTodo]
    updateCase(
      currentCase.caseNumber,
      { todos: updatedTodos },
      {
        action: "added",
        field: "todo",
        newValue: todoActivity,
        description: `Added to-do from Case Notes: ${todoActivity}`,
      },
    )

    setQuickTodoAdded((prev) => [...prev, todoActivity])
    setTodoActivity("")
    setTodoDateScheduled("")
  }

  const handleOpenInNewWindow = () => {
    const newWindow = window.open("", "_blank", "width=900,height=700")
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${editingNote ? "Edit Note" : "Create Note"}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              .form-group { margin-bottom: 15px; }
              label { display: block; margin-bottom: 5px; font-weight: 500; }
              input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
              textarea { min-height: 400px; font-family: inherit; }
            </style>
          </head>
          <body>
            <h2>${editingNote ? "Edit Note" : "Create Note"}</h2>
            <div class="form-group">
              <label>Note Date</label>
              <input type="date" value="${noteDate}" />
            </div>
            <div class="form-group">
              <label>Activity</label>
              <select>
                <option value="phone">Phone Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="review">Case Review</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea>${content}</textarea>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  return (
    <div className="case-notes-tab space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Case Notes</h3>
          <p className="text-sm text-muted-foreground">
            {notes.length} note{notes.length !== 1 ? "s" : ""} for this case
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "detail" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("detail")}
              className="rounded-l-none"
            >
              <LayoutList className="h-4 w-4 mr-1" />
              Detail
            </Button>
          </div>
          <Button size="sm" onClick={handleCreateNote}>
            <Plus className="mr-2 h-4 w-4" />
            Add Case Note
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="notes-list border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Notes Preview</TableHead>
                <TableHead>Case Manager</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No case notes yet. Click "Add Note" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note) => (
                  <TableRow key={note.id} className={note.lineout ? "opacity-60" : ""}>
                    <TableCell className={`font-medium ${note.lineout ? "line-through" : ""}`}>
                      {(() => { const d = new Date(note.noteDate); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`; })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={note.lineout ? "line-through" : ""}>
                          {note.activity}
                        </Badge>
                        {note.isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {note.lineout && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div 
                        className={`truncate ${note.lineout ? "line-through" : ""}`} 
                        dangerouslySetInnerHTML={{ __html: note.notes.substring(0, 100) }} 
                      />
                    </TableCell>
                    <TableCell className={`pii-data ${note.lineout ? "line-through" : ""}`}>
                      {note.caseManager}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        v{note.currentVersion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {note.versions && note.versions.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowVersionHistory(note)}
                            title="View version history"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleLock(note)}
                            title={note.isLocked ? "Unlock note" : "Lock note"}
                          >
                            {note.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                          disabled={note.isLocked && !isAdmin || note.lineout}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={note.isLocked && !isAdmin || note.lineout}
                        >
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
      ) : (
        <div className="notes-detail-view space-y-4">
          {notes.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              No case notes yet. Click "Add Note" to get started.
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className={`note-detail-item border rounded-lg overflow-hidden ${note.lineout ? "opacity-60" : ""}`}>
                <div className="note-header bg-muted/30 p-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Date</div>
                      <div className={`font-medium ${note.lineout ? "line-through" : ""}`}>
                        {(() => { const d = new Date(note.noteDate); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`; })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Activity</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={note.lineout ? "line-through" : ""}>
                          {note.activity}
                        </Badge>
                        {note.isLocked && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                        {note.lineout && <Badge variant="destructive">Deleted</Badge>}
                      </div>
                    </div>
                    <div className="pii-data">
                      <div className="text-xs text-muted-foreground mb-1">Case Manager</div>
                      <div className={note.lineout ? "line-through" : ""}>{note.caseManager}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Version</div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        v{note.currentVersion}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Entered</div>
                      <div>{(() => { const d = new Date(note.dateEntered); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`; })()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {note.versions && note.versions.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => handleShowVersionHistory(note)}>
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => handleToggleLock(note)} disabled={note.lineout}>
                        {note.isLocked ? (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Unlock
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            Lock
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      disabled={note.isLocked && !isAdmin || note.lineout}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={note.isLocked && !isAdmin || note.lineout}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="note-content p-6 bg-background phi-data">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">NOTE CONTENT</div>
                  <div
                    className={`prose prose-sm max-w-none ${note.lineout ? "line-through" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: note.notes || "<p class='text-muted-foreground italic'>No content</p>",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="w-[95vw] max-w-4xl h-auto max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View all versions of this case note. Current version: v{selectedNoteForHistory?.currentVersion}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <Button variant={!diffMode ? "default" : "outline"} size="sm" onClick={() => setDiffMode(false)}>
                All Versions
              </Button>
              <Button
                variant={diffMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDiffMode(true)}
                disabled={!selectedNoteForHistory?.versions || selectedNoteForHistory.versions.length === 0}
              >
                Show Differences
              </Button>
            </div>

            {diffMode && selectedNoteForHistory && selectedNoteForHistory.versions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousDiff}
                  disabled={compareVersionIndex >= selectedNoteForHistory.versions.length}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Older
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Comparing v{getDiffContent()?.oldVersionNumber} → v{getDiffContent()?.newVersionNumber}
                </span>
                <Button variant="outline" size="sm" onClick={handleNextDiff} disabled={compareVersionIndex === 0}>
                  Newer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {diffMode && getDiffContent() ? (
            <div className="space-y-4">
              <div className="diff-view border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <Badge variant="outline" className="font-mono">
                        v{getDiffContent()?.oldVersionNumber}
                      </Badge>
                      <div className="text-muted-foreground mt-1">
                        {(() => { const d = new Date(getDiffContent()?.oldDate || ""); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()} ${d.toLocaleTimeString()}`; })()}
                      </div>
                      <div className="pii-data text-xs">{getDiffContent()?.oldEditor}</div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div>
                      <Badge className="font-mono">v{getDiffContent()?.newVersionNumber}</Badge>
                      <div className="text-muted-foreground mt-1">
                        {(() => { const d = new Date(getDiffContent()?.newDate || ""); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()} ${d.toLocaleTimeString()}`; })()}
                      </div>
                      <div className="pii-data text-xs">{getDiffContent()?.newEditor}</div>
                    </div>
                  </div>
                </div>

                <div className="diff-legend flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#d4edda] border border-[#c3e6cb] rounded"></div>
                    <span>Added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#f8d7da] border border-[#f5c6cb] rounded"></div>
                    <span>Removed</span>
                  </div>
                </div>

                <div
                  className="diff-content prose prose-sm max-w-none phi-data p-4 bg-background rounded border break-words overflow-x-hidden"
                  style={{ wordBreak: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: getDiffContent()?.diffHtml || "" }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedNoteForHistory && (
                <div className="border rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className="font-mono">v{selectedNoteForHistory.currentVersion}</Badge>
                      <Badge variant="secondary">Current</Badge>
                      <span className="text-sm text-muted-foreground">
                        {(() => { const d = new Date(selectedNoteForHistory.dateEntered); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()} ${d.toLocaleTimeString()}`; })()}
                      </span>
                      <span className="text-sm pii-data">by {selectedNoteForHistory.caseManager}</span>
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none phi-data"
                    dangerouslySetInnerHTML={{ __html: selectedNoteForHistory.notes }}
                  />
                </div>
              )}

              {selectedNoteForHistory?.versions &&
                selectedNoteForHistory.versions
                  .slice()
                  .reverse()
                  .map((version, index) => {
                    const versionNumber = selectedNoteForHistory.currentVersion - 1 - index
                    return (
                      <div key={version.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">
                              v{versionNumber}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {(() => { const d = new Date(version.editedAt); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()} ${d.toLocaleTimeString()}`; })()}
                            </span>
                            <span className="text-sm pii-data">by {version.editedBy}</span>
                          </div>
                        </div>
                        <div
                          className="prose prose-sm max-w-none phi-data"
                          dangerouslySetInnerHTML={{ __html: version.content }}
                        />
                      </div>
                    )
                  })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NoteWindow
        isOpen={isDialogOpen}
        isMinimized={isMinimized}
        onClose={() => setIsDialogOpen(false)}
        onMinimize={() => setIsMinimized(true)}
        onRestore={() => setIsMinimized(false)}
        onOpenInNewWindow={handleOpenInNewWindow}
        title={editingNote ? `Edit Note (v${editingNote.currentVersion})` : "Create Note"}
        onCancel={() => setIsDialogOpen(false)}
        onSaveNote={handleSaveNoteAction}
      >
        <div className="note-form space-y-4 p-6">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {editingNote?.isLocked && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                This note is locked by {editingNote.lockedBy}.{" "}
                {!isAdmin && "Only administrators can edit locked notes."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="note-date" className="text-xs">
                Note Date
              </Label>
              <Input
                id="note-date"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="bg-background h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="activity" className="text-xs">
                Activity <span className="text-destructive">*</span>
              </Label>
              <Select
                value={activity}
                onValueChange={(value) => {
                  setActivity(value)
                  if (validationError) setValidationError("")
                }}
              >
                <SelectTrigger
                  id="activity"
                  className={`bg-background h-8 text-sm ${!activity && validationError ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select activity..." />
                </SelectTrigger>
                <SelectContent>
                  {codes.caseActivity
                    .filter((code) => code.active)
                    .map((code) => (
                      <SelectItem key={code.id} value={code.code}>
                        {code.description || code.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="case-note-template" className="text-xs">
                Case Note Template
              </Label>
              <Select
                value={selectedTemplate}
                onValueChange={(value) => {
                  setSelectedTemplate(value)
                  const template = codes.caseNoteTemplates.find((t) => t.code === value)
                  if (template?.content) {
                    // Convert plain text with newlines to HTML paragraphs
                    const htmlContent = template.content
                      .split('\n\n')
                      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
                      .join('')
                    setContent(htmlContent)
                  }
                }}
              >
                <SelectTrigger id="case-note-template" className="bg-background h-8 text-sm">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                  {codes.caseNoteTemplates
                    .filter((template) => template.active)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.code}>
                        {template.name || template.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-case-manager" className="text-xs">Case Manager</Label>
              <Select
                value={noteCaseManager}
                onValueChange={(value) => setNoteCaseManager(value)}
              >
                <SelectTrigger id="note-case-manager" className="bg-background h-8 text-sm">
                  <SelectValue placeholder="Select case manager..." />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                  {caseManagers
                    .filter((cm) => cm.active)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cm) => (
                      <SelectItem key={cm.id} value={cm.name}>
                        {cm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Notes <span className="text-destructive">*</span>
            </Label>
            <RichTextEditor
              value={content}
              onChange={(value) => {
                setContent(value)
                if (validationError) setValidationError("")
              }}
              placeholder="Type your case notes here..."
              className="phi-data"
            />
          </div>

          {/* Quick Entry: Absence */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
              onClick={() => setShowQuickAbsence(!showQuickAbsence)}
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Quick Add Absence Entry
              </span>
              {showQuickAbsence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showQuickAbsence && (
              <div className="p-4 space-y-3 border-t">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Effective Date</Label>
                    <Input
                      type="date"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      className="bg-background h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={absenceStatus} onValueChange={setAbsenceStatus}>
                      <SelectTrigger className="bg-background h-8 text-sm">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {absenceStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={handleQuickAddAbsence}
                      disabled={!absenceDate || !absenceStatus}
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
                {absenceStatus === "OTH" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Other Name</Label>
                    <Input
                      value={absenceOtherName}
                      onChange={(e) => setAbsenceOtherName(e.target.value)}
                      placeholder="Enter other name..."
                      className="bg-background h-8 text-sm"
                    />
                  </div>
                )}
                {quickAbsenceAdded.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <span className="font-medium">Added this session:</span>
                    {quickAbsenceAdded.map((item, i) => (
                      <Badge key={i} variant="secondary" className="ml-1 text-xs">
                        {item.date} - {item.status}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Entry: Restriction */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
              onClick={() => setShowQuickRestriction(!showQuickRestriction)}
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Quick Add Restriction
              </span>
              {showQuickRestriction ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showQuickRestriction && (
              <div className="p-4 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Restriction Type</Label>
                    <Select value={restrictionType} onValueChange={setRestrictionType}>
                      <SelectTrigger className="bg-background h-8 text-sm">
                        <SelectValue placeholder="Select restriction..." />
                      </SelectTrigger>
                      <SelectContent>
                        {restrictionOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={restrictionStartDate}
                      onChange={(e) => setRestrictionStartDate(e.target.value)}
                      className="bg-background h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={restrictionEndDate}
                      onChange={(e) => setRestrictionEndDate(e.target.value)}
                      className="bg-background h-8 text-sm"
                      disabled={restrictionPermanent}
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Checkbox
                      id="quick-permanent"
                      checked={restrictionPermanent}
                      onCheckedChange={(checked) => {
                        setRestrictionPermanent(checked as boolean)
                        if (checked) setRestrictionEndDate("")
                      }}
                    />
                    <Label htmlFor="quick-permanent" className="text-xs font-normal cursor-pointer">
                      Permanent
                    </Label>
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={handleQuickAddRestriction}
                      disabled={!restrictionType || !restrictionStartDate}
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={restrictionNotes}
                    onChange={(e) => setRestrictionNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="bg-background h-8 text-sm"
                  />
                </div>
                {quickRestrictionAdded.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <span className="font-medium">Added this session:</span>
                    {quickRestrictionAdded.map((item, i) => (
                      <Badge key={i} variant="secondary" className="ml-1 text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Entry: To-Do */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
              onClick={() => setShowQuickTodo(!showQuickTodo)}
            >
              <span className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Quick Add To-Do
              </span>
              {showQuickTodo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showQuickTodo && (
              <div className="p-4 space-y-3 border-t">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Activity</Label>
                    <Input
                      type="text"
                      placeholder="Enter to-do activity..."
                      value={todoActivity}
                      onChange={(e) => setTodoActivity(e.target.value)}
                      className="bg-background h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={todoDateScheduled}
                      onChange={(e) => setTodoDateScheduled(e.target.value)}
                      className="bg-background h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={handleQuickAddTodo}
                    disabled={!todoActivity}
                  >
                    <Plus className="h-3 w-3" />
                    Add To-Do
                  </Button>
                </div>
                {quickTodoAdded.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <span className="font-medium">Added this session:</span>
                    {quickTodoAdded.map((item, i) => (
                      <Badge key={i} variant="secondary" className="ml-1 text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </NoteWindow>

      {isMinimized && (
        <div className="fixed bottom-4 left-4 z-40">
          <MinimizedNoteWindow
            title={editingNote ? `Edit Note (v${editingNote.currentVersion})` : "Create Note"}
            onRestore={() => setIsMinimized(false)}
            onClose={() => {
              setIsMinimized(false)
              setIsDialogOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

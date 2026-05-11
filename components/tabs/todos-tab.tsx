"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Wand2, FileText, Edit2, CheckSquare, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCases } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { generateTodosFromTemplates } from "@/lib/todo-parser"
import type { TodoItem } from "@/contexts/cases-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { triggerConfetti } from "@/lib/confetti"

export function TodosTab() {
  const { currentCase, updateCase } = useCases()
  const { getCaseType, caseManagers: adminCaseManagers } = useAdmin()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [anchorDates, setAnchorDates] = useState({
    dateOfDisability: "",
    surgeryDate: "",
    deliveryDate: "",
  })

  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [filterCase, setFilterCase] = useState<"all" | "current">("all")
  
  // Bulk selection state
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set())
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkCaseManager, setBulkCaseManager] = useState<string>("")
  const [bulkCompleted, setBulkCompleted] = useState<string>("")
  
  // State for completion note dialog
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [pendingCompleteTodo, setPendingCompleteTodo] = useState<TodoItem | null>(null)
  const [completionNote, setCompletionNote] = useState("")

  useEffect(() => {
    if (currentCase?.todos) {
      setTodos(currentCase.todos)
    }
  }, [currentCase?.caseNumber]) // Only re-run when case number changes

  // Populate dateOfDisability from case when dialog opens
  useEffect(() => {
    if (showGenerateDialog && currentCase?.dateOfDisability) {
      setAnchorDates(prev => ({
        ...prev,
        dateOfDisability: currentCase.dateOfDisability || ""
      }))
    }
  }, [showGenerateDialog, currentCase?.dateOfDisability])

  const addTodo = () => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      activity: "",
      caseManager: "", // Changed from practitioner to caseManager
      completed: false,
    }
    const updatedTodos = [...todos, newTodo]
    setTodos(updatedTodos)
    if (currentCase) {
      updateCase(
        currentCase.caseNumber,
        { todos: updatedTodos },
        {
          action: "added",
          field: "todo",
          newValue: "New todo item",
          description: "Added new todo item",
        },
      )
    }
  }

  const updateTodo = (id: string, updates: Partial<TodoItem>) => {
    const oldTodo = todos.find((t) => t.id === id)
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    setTodos(updatedTodos)

    if (currentCase && oldTodo) {
      let description = ""
      if (updates.completed !== undefined) {
        description = updates.completed
          ? `Completed todo: ${oldTodo.activity || "Untitled"}`
          : `Reopened todo: ${oldTodo.activity || "Untitled"}`
      } else if (updates.activity) {
        description = `Updated todo: ${updates.activity}`
      } else {
        description = `Modified todo: ${oldTodo.activity || "Untitled"}`
      }

      updateCase(
        currentCase.caseNumber,
        { todos: updatedTodos },
        {
          action: "updated",
          field: "todo",
          oldValue: oldTodo.activity,
          newValue: updates.activity || oldTodo.activity,
          description,
        },
      )
    }
  }

  // Update a todo's date and cascade the change to all subsequent todos
  const updateTodoDateWithCascade = (id: string, newDate: string) => {
    const todoIndex = todos.findIndex((t) => t.id === id)
    if (todoIndex === -1) return

    const oldTodo = todos[todoIndex]
    const oldDate = oldTodo.dateScheduled

    // If no old date or no new date, just do a regular update
    if (!oldDate || !newDate) {
      updateTodo(id, { dateScheduled: newDate })
      return
    }

    // Calculate the difference in days
    const oldDateObj = new Date(oldDate)
    const newDateObj = new Date(newDate)
    const daysDifference = Math.round((newDateObj.getTime() - oldDateObj.getTime()) / (1000 * 60 * 60 * 24))

    // If no difference, just update normally
    if (daysDifference === 0) {
      updateTodo(id, { dateScheduled: newDate })
      return
    }

    // Update the changed todo and cascade to all todos below it
    const updatedTodos = todos.map((todo, index) => {
      if (index < todoIndex) {
        // Todos above - keep unchanged
        return todo
      } else if (index === todoIndex) {
        // The changed todo - use the new date
        return { ...todo, dateScheduled: newDate }
      } else {
        // Todos below - shift by the same number of days
        if (todo.dateScheduled) {
          const todoDate = new Date(todo.dateScheduled)
          todoDate.setDate(todoDate.getDate() + daysDifference)
          return { ...todo, dateScheduled: todoDate.toISOString().split("T")[0] }
        }
        return todo
      }
    })

    setTodos(updatedTodos)

    if (currentCase) {
      const affectedCount = todos.length - todoIndex
      updateCase(
        currentCase.caseNumber,
        { todos: updatedTodos },
        {
          action: "updated",
          field: "todo",
          oldValue: oldDate,
          newValue: newDate,
          description: `Updated date for "${oldTodo.activity || "Untitled"}" and cascaded ${daysDifference > 0 ? "+" : ""}${daysDifference} days to ${affectedCount - 1} subsequent todo(s)`,
        },
      )
    }
  }

  const deleteTodo = (id: string) => {
    const todo = todos.find((t) => t.id === id)
    const updatedTodos = todos.filter((todo) => todo.id !== id)
    setTodos(updatedTodos)
    if (currentCase && todo) {
      updateCase(
        currentCase.caseNumber,
        { todos: updatedTodos },
        {
          action: "removed",
          field: "todo",
          oldValue: todo.activity || "Untitled",
          description: `Deleted todo: ${todo.activity || "Untitled"}`,
        },
      )
    }
  }

  const handleGenerateTodos = () => {
    if (!currentCase) return

    const caseType = getCaseType(currentCase.caseType)
    if (!caseType || !caseType.defaultTodos || caseType.defaultTodos.length === 0) {
      alert("No todo templates found for this case type.")
      return
    }

    const dates = {
      caseCreation: new Date(anchorDates.dateOfDisability || new Date()),
      dateOfDisability: new Date(anchorDates.dateOfDisability || new Date()),
    }

    const parsedTodos = generateTodosFromTemplates(caseType.defaultTodos, dates)

    const newTodos: TodoItem[] = parsedTodos.map((pt, index) => ({
      id: `${Date.now()}-${index}`,
      dateScheduled: pt.dueDate.toISOString().split("T")[0],
      activity: pt.title,
      caseManager: "",
      completed: false,
    }))

    const updatedTodos = [...todos, ...newTodos]
    setTodos(updatedTodos)
    updateCase(
      currentCase.caseNumber,
      { todos: updatedTodos },
      {
        action: "added",
        field: "todos",
        newValue: `${newTodos.length} items`,
        description: `Generated ${newTodos.length} todos from ${caseType.name} template`,
      },
    )
    setShowGenerateDialog(false)
  }

  // Handle initiating todo completion (shows dialog)
  const initiateTodoCompletion = (todo: TodoItem) => {
    setPendingCompleteTodo(todo)
    setCompletionNote("")
    setShowNoteDialog(true)
  }

  // Handle confirming todo completion with note
  const confirmTodoCompletion = () => {
    if (!pendingCompleteTodo || !currentCase) return

    const checkbox = document.querySelector(`[data-todo-id="${pendingCompleteTodo.id}"]`) as HTMLElement
    if (checkbox) {
      const rect = checkbox.getBoundingClientRect()
      triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }

    // Update the todo
    updateTodo(pendingCompleteTodo.id, {
      completed: true,
      dateClosed: new Date().toISOString().split("T")[0],
    })

    // Always add a case note for completed todos
    const newNote = {
      id: Date.now().toString(),
      caseNumber: currentCase.caseNumber,
      noteDate: new Date().toISOString().split("T")[0],
      activity: `Completed To-Do: ${pendingCompleteTodo.activity || "Untitled"}`,
      caseManager: currentCase.caseManager || "",
      notes: completionNote.trim() || "To-do completed.",
      createdBy: currentCase.caseManager || "System",
      dateEntered: new Date().toISOString(),
      lineout: false,
      isLocked: false,
      versions: [],
      currentVersion: 0,
    }
    
    const updatedNotes = [...(currentCase.caseNotes || []), newNote]
    updateCase(
      currentCase.caseNumber,
      { caseNotes: updatedNotes },
      {
        action: "added",
        field: "caseNote",
        newValue: `Note for completed todo: ${pendingCompleteTodo.activity}`,
        description: `Added case note for completed todo: ${pendingCompleteTodo.activity}`,
      }
    )

    // Reset state
    setShowNoteDialog(false)
    setPendingCompleteTodo(null)
    setCompletionNote("")
  }

  // Handle canceling todo completion
  const cancelTodoCompletion = () => {
    setShowNoteDialog(false)
    setPendingCompleteTodo(null)
    setCompletionNote("")
  }

  const filteredTodos = todos.filter((todo) => {
    // Filter by active status (completed vs not completed)
    if (filterActive === "active" && todo.completed) return false
    if (filterActive === "inactive" && !todo.completed) return false

    // Filter by case (todos don't have caseNumber yet, future enhancement)
    return true
  })

  // Toggle single todo selection
  const toggleTodoSelection = (todoId: string) => {
    setSelectedTodos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(todoId)) {
        newSet.delete(todoId)
      } else {
        newSet.add(todoId)
      }
      return newSet
    })
  }

  // Select all filtered todos
  const selectAllTodos = () => {
    const allIds = filteredTodos.map((todo) => todo.id)
    setSelectedTodos(new Set(allIds))
  }

  // Deselect all todos
  const deselectAllTodos = () => {
    setSelectedTodos(new Set())
  }

  // Check if all filtered todos are selected
  const allSelected = filteredTodos.length > 0 && filteredTodos.every((todo) => selectedTodos.has(todo.id))

  // Check if some filtered todos are selected
  const someSelected = selectedTodos.size > 0

  // Apply bulk edit changes
  const applyBulkEdit = () => {
    if (selectedTodos.size === 0 || !currentCase) return

    const updatedTodos = todos.map((todo) => {
      if (!selectedTodos.has(todo.id)) return todo

      const updates: Partial<TodoItem> = {}
      if (bulkCaseManager && bulkCaseManager !== "no-change") {
        updates.caseManager = bulkCaseManager
      }
      if (bulkCompleted === "completed") {
        updates.completed = true
        updates.dateClosed = new Date().toISOString().split("T")[0]
      } else if (bulkCompleted === "active") {
        updates.completed = false
        updates.dateClosed = undefined
      }

      return { ...todo, ...updates }
    })

    setTodos(updatedTodos)
    updateCase(
      currentCase.caseNumber,
      { todos: updatedTodos },
      {
        action: "updated",
        field: "todos",
        newValue: `${selectedTodos.size} items`,
        description: `Bulk updated ${selectedTodos.size} todo(s)`,
      }
    )

    // Reset bulk edit state
    setSelectedTodos(new Set())
    setBulkEditMode(false)
    setBulkCaseManager("")
    setBulkCompleted("")
  }

  // Bulk delete selected todos
  const bulkDeleteTodos = () => {
    if (selectedTodos.size === 0 || !currentCase) return
    if (!confirm(`Are you sure you want to delete ${selectedTodos.size} todo(s)?`)) return

    const updatedTodos = todos.filter((todo) => !selectedTodos.has(todo.id))
    setTodos(updatedTodos)
    updateCase(
      currentCase.caseNumber,
      { todos: updatedTodos },
      {
        action: "removed",
        field: "todos",
        oldValue: `${selectedTodos.size} items`,
        description: `Bulk deleted ${selectedTodos.size} todo(s)`,
      }
    )

    // Reset selection
    setSelectedTodos(new Set())
    setBulkEditMode(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">To-Do Activities</h3>
        <div className="flex gap-2">
          {currentCase?.caseType && (
            <Button size="sm" variant="outline" onClick={() => setShowGenerateDialog(true)}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate from Template
            </Button>
          )}
          <Button size="sm" onClick={addTodo}>
            <Plus className="mr-2 h-4 w-4" />
            Add To-Do
          </Button>
        </div>
      </div>

      {/* Bulk Edit Toolbar */}
      {someSelected && (
        <div className="border border-primary rounded-lg p-4 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedTodos.size} selected</span>
            </div>
            
            <div className="h-6 w-px bg-border" />
            
            {!bulkEditMode ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setBulkEditMode(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Selected
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={bulkDeleteTodos}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={deselectAllTodos}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Case Manager:</Label>
                  <Select value={bulkCaseManager} onValueChange={setBulkCaseManager}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="No change" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      {adminCaseManagers
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
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Status:</Label>
                  <Select value={bulkCompleted} onValueChange={setBulkCompleted}>
                    <SelectTrigger className="w-[150px] h-8">
                      <SelectValue placeholder="No change" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="completed">Mark Completed</SelectItem>
                      <SelectItem value="active">Mark Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" onClick={applyBulkEdit} disabled={(!bulkCaseManager || bulkCaseManager === "no-change") && (!bulkCompleted || bulkCompleted === "no-change")}>
                    Apply Changes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setBulkEditMode(false)
                    setBulkCaseManager("")
                    setBulkCompleted("")
                  }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
              <SelectItem value="inactive">Completed</SelectItem>
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
          Showing {filteredTodos.length} of {todos.length} todos
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllTodos()
                    } else {
                      deselectAllTodos()
                    }
                  }}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[150px]">Date Scheduled</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="w-[150px]">Case Manager</TableHead>
              <TableHead className="w-[100px]">Completed</TableHead>
              <TableHead className="w-[150px]">Date Closed</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTodos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No to-do items found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredTodos.map((todo) => {
                const isSelected = selectedTodos.has(todo.id)
                return (
                  <TableRow key={todo.id} className={isSelected ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTodoSelection(todo.id)}
                        aria-label={`Select todo: ${todo.activity}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={todo.dateScheduled || ""}
                        onChange={(e) => updateTodoDateWithCascade(todo.id, e.target.value)}
                        title="Changing this date will shift all subsequent todo dates by the same amount"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Enter activity..."
                        value={todo.activity}
                        onChange={(e) => updateTodo(todo.id, { activity: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Case Manager"
                        value={todo.caseManager}
                        onChange={(e) => updateTodo(todo.id, { caseManager: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={(checked) => {
                            if (checked && !todo.completed) {
                              // Show dialog to add note before completing
                              initiateTodoCompletion(todo)
                            } else {
                              // Unchecking - just update directly
                              updateTodo(todo.id, {
                                completed: false,
                                dateClosed: undefined,
                              })
                            }
                          }}
                          data-todo-id={todo.id}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={todo.dateClosed || ""}
                        onChange={(e) => updateTodo(todo.id, { dateClosed: e.target.value })}
                        disabled={!todo.completed}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => deleteTodo(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Todos from Template</DialogTitle>
            <DialogDescription>
              Set anchor dates to calculate due dates for todo items. Auto-populated from Case Dates if available.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfDisability">Date of Disability</Label>
              <Input
                id="dateOfDisability"
                type="date"
                value={anchorDates.dateOfDisability}
                onChange={(e) => setAnchorDates({ ...anchorDates, dateOfDisability: e.target.value })}
              />
            </div>

            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateTodos}>Generate Todos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={(open) => !open && cancelTodoCompletion()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete To-Do
            </DialogTitle>
            <DialogDescription>
              A case note will be added when completing this to-do. You can add additional details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">To-Do Activity</div>
              <div className="font-medium">{pendingCompleteTodo?.activity || "Untitled"}</div>
              {pendingCompleteTodo?.dateScheduled && (
                <div className="text-sm text-muted-foreground mt-1">
                  Scheduled: {pendingCompleteTodo.dateScheduled}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionNote">Case Note (optional)</Label>
              <Textarea
                id="completionNote"
                placeholder="Enter any notes about completing this to-do..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelTodoCompletion}>
              Cancel
            </Button>
            <Button onClick={confirmTodoCompletion}>
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

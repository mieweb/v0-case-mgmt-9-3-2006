"use client"

import { useMemo, useState, useEffect } from "react"
import { useCases } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { useUser } from "@/contexts/user-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, CheckCircle2, Circle, AlertCircle, Printer, CheckSquare, Square, Edit2, Trash2, X, Bookmark, BookmarkCheck } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SavedSearch {
  id: string
  name: string
  searchTerm: string
  filterStatus: string
  filterCaseManager: string
  filterCaseType: string
  userId: string
  createdAt: string
}

interface TodoBacklogProps {
  onBack: () => void
  onViewCase: (caseNumber: string) => void
}

export function TodoBacklog({ onBack, onViewCase }: TodoBacklogProps) {
  const { cases, setCurrentCase } = useCases()
  const { getCaseType, caseManagers: adminCaseManagers, caseTypes: adminCaseTypes, codes } = useAdmin()
  const { currentUser } = useUser()
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCaseManager, setFilterCaseManager] = useState<string>("all")
  const [filterCaseType, setFilterCaseType] = useState<string>("all")
  const [filterDraftLetters, setFilterDraftLetters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set())
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkCaseManager, setBulkCaseManager] = useState<string>("")
  const [bulkCompleted, setBulkCompleted] = useState<string>("")
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [activeSavedSearch, setActiveSavedSearch] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newSearchName, setNewSearchName] = useState("")

  // Load saved searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("todoBacklogSavedSearches")
    if (stored) {
      try {
        const allSearches: SavedSearch[] = JSON.parse(stored)
        // Filter to only show current user's saved searches
        const userSearches = allSearches.filter((s) => s.userId === currentUser?.id)
        setSavedSearches(userSearches)
      } catch (e) {
        console.error("Failed to load saved searches:", e)
      }
    }
  }, [currentUser?.id])

  // Save a new search
  const saveCurrentSearch = () => {
    if (!newSearchName.trim() || !currentUser?.id) return

    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: newSearchName.trim(),
      searchTerm,
      filterStatus,
      filterCaseManager,
      filterCaseType,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    }

    // Get all searches from localStorage (including other users)
    const stored = localStorage.getItem("todoBacklogSavedSearches")
    const allSearches: SavedSearch[] = stored ? JSON.parse(stored) : []
    
    // Add new search
    allSearches.push(newSearch)
    localStorage.setItem("todoBacklogSavedSearches", JSON.stringify(allSearches))

    // Update local state with user's searches
    setSavedSearches((prev) => [...prev, newSearch])
    setNewSearchName("")
    setShowSaveDialog(false)
  }

  // Apply a saved search
  const applySavedSearch = (search: SavedSearch) => {
    if (activeSavedSearch === search.id) {
      // Toggle off - reset filters
      setSearchTerm("")
      setFilterStatus("all")
      setFilterCaseManager("all")
      setFilterCaseType("all")
      setActiveSavedSearch(null)
    } else {
      setSearchTerm(search.searchTerm)
      setFilterStatus(search.filterStatus)
      setFilterCaseManager(search.filterCaseManager)
      setFilterCaseType(search.filterCaseType)
      setFilterDraftLetters(false) // Clear draft letters filter when applying saved search
      setActiveSavedSearch(search.id)
    }
  }

  // Delete a saved search
  const deleteSavedSearch = (searchId: string) => {
    // Get all searches from localStorage
    const stored = localStorage.getItem("todoBacklogSavedSearches")
    const allSearches: SavedSearch[] = stored ? JSON.parse(stored) : []
    
    // Remove the search
    const updated = allSearches.filter((s) => s.id !== searchId)
    localStorage.setItem("todoBacklogSavedSearches", JSON.stringify(updated))

    // Update local state
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId))
    if (activeSavedSearch === searchId) {
      setActiveSavedSearch(null)
    }
  }

  // Check if current filters match any criteria worth saving
  const hasActiveFilters = searchTerm || filterStatus !== "all" || filterCaseManager !== "all" || filterCaseType !== "all"

  // Collect all todos from all cases
  const allTodos = useMemo(() => {
    const todos: Array<{
      todo: {
        id: string
        dateScheduled?: string
        activity: string
        caseManager: string
        completed: boolean
        dateClosed?: string
      }
      caseNumber: string
      employeeName: string
      caseType: string
      caseStatus: string
      caseCaseManager: string
    }> = []

    cases.forEach((c) => {
      if (c.todos && c.todos.length > 0) {
        c.todos.forEach((todo) => {
          todos.push({
            todo,
            caseNumber: c.caseNumber,
            employeeName: c.employeeName,
            caseType: c.caseType,
            caseStatus: c.status,
            caseCaseManager: c.caseManager,
          })
        })
      }
    })

    return todos
  }, [cases])

  // Get unique case managers for filter (combine admin list with any from todos)
  const caseManagers = useMemo(() => {
    const managers = new Set<string>()
    // Add all active case managers from admin
    adminCaseManagers.filter(cm => cm.active).forEach(cm => managers.add(cm.name))
    // Also include any case managers from existing todos (for backwards compatibility)
    allTodos.forEach((t) => {
      if (t.todo.caseManager) managers.add(t.todo.caseManager)
      if (t.caseCaseManager) managers.add(t.caseCaseManager)
    })
    return Array.from(managers).sort()
  }, [allTodos, adminCaseManagers])

  // Get unique case types for filter (combine admin list with any from todos)
  const caseTypes = useMemo(() => {
    const types = new Set<string>()
    // Add all case types from admin
    adminCaseTypes.forEach(ct => types.add(ct.name))
    // Also include any case types from existing todos (for backwards compatibility)
    allTodos.forEach((t) => {
      if (t.caseType) types.add(t.caseType)
    })
    return Array.from(types).sort()
  }, [allTodos, adminCaseTypes])

  // Filter todos
  const filteredTodos = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allTodos.filter((item) => {
      // Status filter
      if (filterStatus !== "all") {
        const isOverdue = !item.todo.completed && item.todo.dateScheduled && new Date(item.todo.dateScheduled) < today
        
        if (filterStatus === "active" && item.todo.completed) return false
        if (filterStatus === "comp" && !item.todo.completed) return false
        if (filterStatus === "over") {
          if (item.todo.completed) return false
          if (!isOverdue) return false
        }
        if (filterStatus === "open" && item.todo.completed) return false
        if (filterStatus === "closed" && !item.todo.completed) return false
        if (filterStatus === "pend" && item.todo.completed) return false
        if (filterStatus === "reopen" && item.todo.completed) return false
      }

      // Case manager filter
      if (filterCaseManager !== "all") {
        if (item.todo.caseManager !== filterCaseManager && item.caseCaseManager !== filterCaseManager) {
          return false
        }
      }

      // Case type filter
      if (filterCaseType !== "all" && item.caseType !== filterCaseType) {
        return false
      }

      // Draft letter filter
      if (filterDraftLetters) {
        if (!item.todo.activity.toLowerCase().includes("complete draft letter")) {
          return false
        }
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        if (
          !item.todo.activity.toLowerCase().includes(search) &&
          !item.employeeName.toLowerCase().includes(search) &&
          !item.caseNumber.toLowerCase().includes(search)
        ) {
          return false
        }
      }

      return true
    })
  }, [allTodos, filterStatus, filterCaseManager, filterCaseType, filterDraftLetters, searchTerm])

  // Stats
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const total = allTodos.length
    const completed = allTodos.filter((t) => t.todo.completed).length
    const active = allTodos.filter((t) => !t.todo.completed).length
    const overdue = allTodos.filter((t) => {
      if (t.todo.completed || !t.todo.dateScheduled) return false
      return new Date(t.todo.dateScheduled) < today
    }).length
    const draftLetters = allTodos.filter((t) => 
      !t.todo.completed && t.todo.activity.toLowerCase().includes("complete draft letter")
    ).length

    return { total, completed, active, overdue, draftLetters }
  }, [allTodos])

  const handleViewCase = (caseNumber: string) => {
    const caseData = cases.find((c) => c.caseNumber === caseNumber)
    if (caseData) {
      setCurrentCase(caseData)
      onViewCase(caseNumber)
    }
  }

  // Generate a unique key for each todo item
  const getTodoKey = (caseNumber: string, todoId: string) => `${caseNumber}-${todoId}`

  // Toggle single todo selection
  const toggleTodoSelection = (caseNumber: string, todoId: string) => {
    const key = getTodoKey(caseNumber, todoId)
    setSelectedTodos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  // Select all filtered todos
  const selectAllTodos = () => {
    const allKeys = filteredTodos.map((item) => getTodoKey(item.caseNumber, item.todo.id))
    setSelectedTodos(new Set(allKeys))
  }

  // Deselect all todos
  const deselectAllTodos = () => {
    setSelectedTodos(new Set())
  }

  // Check if all filtered todos are selected
  const allSelected = filteredTodos.length > 0 && filteredTodos.every((item) => 
    selectedTodos.has(getTodoKey(item.caseNumber, item.todo.id))
  )

  // Check if some filtered todos are selected
  const someSelected = selectedTodos.size > 0

  // Apply bulk edit changes
  const { updateCase } = useCases()
  
  const applyBulkEdit = () => {
    if (selectedTodos.size === 0) return

    // Group selected todos by case
    const todosByCase = new Map<string, string[]>()
    selectedTodos.forEach((key) => {
      const [caseNumber, todoId] = key.split("-")
      if (!todosByCase.has(caseNumber)) {
        todosByCase.set(caseNumber, [])
      }
      todosByCase.get(caseNumber)!.push(todoId)
    })

    // Update each case
    todosByCase.forEach((todoIds, caseNumber) => {
      const caseData = cases.find((c) => c.caseNumber === caseNumber)
      if (!caseData) return

      const updatedTodos = caseData.todos.map((todo) => {
        if (!todoIds.includes(todo.id)) return todo
        
        const updates: Partial<typeof todo> = {}
        if (bulkCaseManager) {
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

      updateCase(caseNumber, { todos: updatedTodos })
    })

    // Reset bulk edit state
    setSelectedTodos(new Set())
    setBulkEditMode(false)
    setBulkCaseManager("")
    setBulkCompleted("")
  }

  // Bulk delete selected todos
  const bulkDeleteTodos = () => {
    if (selectedTodos.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedTodos.size} todo(s)?`)) return

    // Group selected todos by case
    const todosByCase = new Map<string, string[]>()
    selectedTodos.forEach((key) => {
      const [caseNumber, todoId] = key.split("-")
      if (!todosByCase.has(caseNumber)) {
        todosByCase.set(caseNumber, [])
      }
      todosByCase.get(caseNumber)!.push(todoId)
    })

    // Update each case
    todosByCase.forEach((todoIds, caseNumber) => {
      const caseData = cases.find((c) => c.caseNumber === caseNumber)
      if (!caseData) return

      const updatedTodos = caseData.todos.filter((todo) => !todoIds.includes(todo.id))
      updateCase(caseNumber, { todos: updatedTodos })
    })

    // Reset selection
    setSelectedTodos(new Set())
    setBulkEditMode(false)
  }

  const getStatusBadge = (todo: { completed: boolean; dateScheduled?: string }) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (todo.completed) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      )
    }

    if (todo.dateScheduled && new Date(todo.dateScheduled) < today) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Circle className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TODO Backlog Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 20px; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat { border: 1px solid #ddd; padding: 10px 15px; border-radius: 4px; }
          .stat-label { color: #666; font-size: 11px; }
          .stat-value { font-size: 18px; font-weight: bold; }
          .stat-active .stat-value { color: #2563eb; }
          .stat-completed .stat-value { color: #16a34a; }
          .stat-overdue .stat-value { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
          .badge-active { background: #e5e7eb; color: #374151; }
          .badge-completed { background: #dcfce7; color: #166534; }
          .badge-overdue { background: #fee2e2; color: #991b1b; }
          .filters { margin-bottom: 15px; color: #666; font-size: 11px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>TODO Backlog Report</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
        <div class="stats">
          <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${stats.total}</div></div>
          <div class="stat stat-active"><div class="stat-label">Active</div><div class="stat-value">${stats.active}</div></div>
          <div class="stat stat-completed"><div class="stat-label">Completed</div><div class="stat-value">${stats.completed}</div></div>
          <div class="stat stat-overdue"><div class="stat-label">Overdue</div><div class="stat-value">${stats.overdue}</div></div>
        </div>
        <div class="filters">
          Filters: Status: ${filterStatus} | Case Manager: ${filterCaseManager} | Case Type: ${filterCaseType}${searchTerm ? ` | Search: "${searchTerm}"` : ""}
          <br/>Showing ${filteredTodos.length} of ${allTodos.length} todos
        </div>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Employee</th>
              <th>Case Number</th>
              <th>Case Type</th>
              <th>Case Manager</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTodos.map((item) => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              let statusClass = "badge-active"
              let statusText = "Active"
              if (item.todo.completed) {
                statusClass = "badge-completed"
                statusText = "Completed"
              } else if (item.todo.dateScheduled && new Date(item.todo.dateScheduled) < today) {
                statusClass = "badge-overdue"
                statusText = "Overdue"
              }
              return `
                <tr>
                  <td>${item.todo.activity || "-"}</td>
                  <td>${item.employeeName}</td>
                  <td>${item.caseNumber}</td>
                  <td>${item.caseType}</td>
                  <td>${item.todo.caseManager || item.caseCaseManager || "-"}</td>
                  <td>${item.todo.dateScheduled || "-"}</td>
                  <td><span class="badge ${statusClass}">${statusText}</span></td>
                  <td>${item.todo.dateClosed || "-"}</td>
                </tr>
              `
            }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const exportToCSV = () => {
    const headers = ["Activity", "Employee", "Case Number", "Case Type", "Case Manager", "Scheduled", "Status", "Closed"]
    const rows = filteredTodos.map((item) => [
      item.todo.activity,
      item.employeeName,
      item.caseNumber,
      item.caseType,
      item.todo.caseManager || item.caseCaseManager,
      item.todo.dateScheduled || "",
      item.todo.completed ? "Completed" : "Active",
      item.todo.dateClosed || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `todo-backlog-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">TODO Backlog</h1>
            <p className="text-muted-foreground">All todos across all cases</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4">
        <Card className="min-w-[120px]">
          <CardHeader className="py-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="min-w-[120px]">
          <CardHeader className="py-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="min-w-[120px]">
          <CardHeader className="py-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="min-w-[120px]">
          <CardHeader className="py-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
        <Card 
          className={`min-w-[120px] cursor-pointer transition-colors hover:border-orange-400 ${filterDraftLetters ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : ""}`}
          onClick={() => setFilterDraftLetters(!filterDraftLetters)}
        >
          <CardHeader className="py-3">
            <CardDescription className="flex items-center justify-between">
              Draft Letters
              {filterDraftLetters && <span className="text-xs text-orange-600">(filtered)</span>}
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.draftLetters}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Bulk Edit Toolbar */}
      {someSelected && (
        <Card className="border-primary">
          <CardContent className="py-4">
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
                    <Button size="sm" onClick={applyBulkEdit} disabled={!bulkCaseManager && !bulkCompleted}>
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
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm">Search</Label>
              <Input
                placeholder="Search activity, employee, case..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {codes.caseStatus
                    .filter((status) => status.active)
                    .map((status) => (
                      <SelectItem key={status.id} value={status.code.toLowerCase()}>
                        {status.description || status.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Case Manager</Label>
              <Select value={filterCaseManager} onValueChange={setFilterCaseManager}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {caseManagers.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Case Type</Label>
              <Select value={filterCaseType} onValueChange={setFilterCaseType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {caseTypes.map((type) => {
                    const displayName = type.includes(" — ") ? type.split(" — ")[1] : type
                    return (
                      <SelectItem key={type} value={type}>
                        {displayName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Save Search Button */}
            {hasActiveFilters && !showSaveDialog && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setShowSaveDialog(true)}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Save Search
              </Button>
            )}
            {showSaveDialog && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter search name..."
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  className="w-[180px] h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCurrentSearch()
                    if (e.key === "Escape") {
                      setShowSaveDialog(false)
                      setNewSearchName("")
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-9" onClick={saveCurrentSearch} disabled={!newSearchName.trim()}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setNewSearchName("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            {/* Saved Searches - Only visible to the user who created them */}
            {savedSearches.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Saved Search:</span>
                {savedSearches.map((search) => (
                  <div key={search.id} className="flex items-center">
                    <Button
                      variant={activeSavedSearch === search.id ? "default" : "outline"}
                      size="sm"
                      className={`h-9 ${activeSavedSearch === search.id ? "bg-purple-600 hover:bg-purple-700" : "hover:border-purple-400"}`}
                      onClick={() => applySavedSearch(search)}
                    >
                      <BookmarkCheck className="h-4 w-4 mr-1.5" />
                      {search.name}
                      {activeSavedSearch === search.id && <span className="ml-1.5 text-xs">(active)</span>}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 ml-1 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSavedSearch(search.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredTodos.length} of {allTodos.length} todos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Todos Table */}
      <Card>
        <CardContent className="p-0">
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
                  <TableHead>Activity</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Case Manager</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No todos found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTodos.map((item, idx) => {
                    const todoKey = getTodoKey(item.caseNumber, item.todo.id)
                    const isSelected = selectedTodos.has(todoKey)
                    return (
                      <TableRow 
                        key={`${item.caseNumber}-${item.todo.id}-${idx}`}
                        className={isSelected ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTodoSelection(item.caseNumber, item.todo.id)}
                            aria-label={`Select todo: ${item.todo.activity}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-[250px] truncate">{item.todo.activity || "-"}</TableCell>
                        <TableCell className="pii-data">{item.employeeName}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto font-mono text-sm"
                            onClick={() => handleViewCase(item.caseNumber)}
                          >
                            {item.caseNumber}
                          </Button>
                        </TableCell>
                        <TableCell>{item.caseType}</TableCell>
                        <TableCell>{item.todo.caseManager || item.caseCaseManager || "-"}</TableCell>
                        <TableCell>{item.todo.dateScheduled || "-"}</TableCell>
                        <TableCell>{getStatusBadge(item.todo)}</TableCell>
                        <TableCell>{item.todo.dateClosed || "-"}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

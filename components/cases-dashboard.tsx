"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Save, Trash2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useCases } from "@/contexts/cases-context"
import { useState } from "react"

interface CasesDashboardProps {
  onViewCase: () => void
}

interface FilterCriteria {
  search: string
  status: string
  caseType: string
  caseManager: string
  location: string
  dateCreatedFrom: string
  dateCreatedTo: string
}

interface SavedFilter {
  id: string
  name: string
  criteria: FilterCriteria
}

type SortField =
  | "caseNumber"
  | "employeeName"
  | "employeeNumber"
  | "status"
  | "caseType"
  | "caseManager"
  | "location"
  | "dateOfDisability"
  | "nextTodo"
type SortDirection = "asc" | "desc" | null

export function CasesDashboard({ onViewCase }: CasesDashboardProps) {
  const { cases, setCurrentCase } = useCases()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeFilterId, setActiveFilterId] = useState<string | null>("my-cases")

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({
    search: "",
    status: "all",
    caseType: "all",
    caseManager: "all",
    location: "all",
    dateCreatedFrom: "",
    dateCreatedTo: "",
  })

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    {
      id: "my-cases",
      name: "My Cases",
      criteria: {
        search: "",
        status: "all",
        caseType: "all",
        caseManager: "all",
        location: "all",
        dateCreatedFrom: "",
        dateCreatedTo: "",
      },
    },
    {
      id: "all-cases",
      name: "All Cases",
      criteria: {
        search: "",
        status: "all",
        caseType: "all",
        caseManager: "all",
        location: "all",
        dateCreatedFrom: "",
        dateCreatedTo: "",
      },
    },
    {
      id: "unassigned",
      name: "Unassigned Cases",
      criteria: {
        search: "",
        status: "Open",
        caseType: "all",
        caseManager: "Unassigned",
        location: "all",
        dateCreatedFrom: "",
        dateCreatedTo: "",
      },
    },
  ])
  const [showSaveFilterDialog, setShowSaveFilterDialog] = useState(false)
  const [filterName, setFilterName] = useState("")

  const filteredCases = cases.filter((caseItem) => {
    const filters = showMoreFilters ? advancedFilters : { search: searchTerm, status: statusFilter }

    const matchesSearch = showMoreFilters
      ? !filters.search ||
        caseItem.employeeName.toLowerCase().includes(filters.search.toLowerCase()) ||
        caseItem.caseNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        caseItem.employeeNumber.toLowerCase().includes(filters.search.toLowerCase())
      : caseItem.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = showMoreFilters
      ? filters.status === "all" || caseItem.status.toLowerCase() === filters.status.toLowerCase()
      : statusFilter === "all" || caseItem.status.toLowerCase() === statusFilter.toLowerCase()

    const matchesCaseType =
      !showMoreFilters || advancedFilters.caseType === "all" || caseItem.caseType === advancedFilters.caseType

    const matchesCaseManager =
      !showMoreFilters ||
      advancedFilters.caseManager === "all" ||
      caseItem.caseManager.toLowerCase() === advancedFilters.caseManager.toLowerCase()

    const matchesLocation =
      !showMoreFilters ||
      advancedFilters.location === "all" ||
      caseItem.employeeLocation === advancedFilters.location

    const matchesDateFrom =
      !showMoreFilters ||
      !advancedFilters.dateCreatedFrom ||
      new Date(caseItem.created) >= new Date(advancedFilters.dateCreatedFrom)

    const matchesDateTo =
      !showMoreFilters ||
      !advancedFilters.dateCreatedTo ||
      new Date(caseItem.created) <= new Date(advancedFilters.dateCreatedTo)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCaseType &&
      matchesCaseManager &&
      matchesLocation &&
      matchesDateFrom &&
      matchesDateTo
    )
  })

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let aValue: any = a[sortField as keyof typeof a]
    let bValue: any = b[sortField as keyof typeof b]

    // Handle special cases
    if (sortField === "nextTodo") {
      const getNextTodoValue = (caseItem: typeof a) => {
        if (!caseItem.todos || caseItem.todos.length === 0) return ""
        const upcomingTodos = caseItem.todos
          .filter((todo) => !todo.completed && todo.dateScheduled)
          .sort((x, y) => new Date(x.dateScheduled!).getTime() - new Date(y.dateScheduled!).getTime())
        return upcomingTodos.length > 0 ? new Date(upcomingTodos[0].dateScheduled!).getTime() : ""
      }
      aValue = getNextTodoValue(a)
      bValue = getNextTodoValue(b)
    }

    // Handle date fields
    if (sortField === "dateOfDisability") {
      aValue = aValue ? new Date(aValue).getTime() : 0
      bValue = bValue ? new Date(bValue).getTime() : 0
    }

    // Handle empty values
    if (!aValue) return sortDirection === "asc" ? 1 : -1
    if (!bValue) return sortDirection === "asc" ? -1 : 1

    // String comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    // Numeric comparison
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Open: "default",
      Pending: "secondary",
      Closed: "outline",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getNextTodo = (caseItem: (typeof cases)[0]) => {
    if (!caseItem.todos || caseItem.todos.length === 0) {
      return "—"
    }

    const now = new Date()
    const upcomingTodos = caseItem.todos
      .filter((todo) => !todo.completed && todo.dateScheduled)
      .sort((a, b) => {
        const dateA = new Date(a.dateScheduled!)
        const dateB = new Date(b.dateScheduled!)
        return dateA.getTime() - dateB.getTime()
      })

    if (upcomingTodos.length === 0) {
      return "—"
    }

    const nextTodo = upcomingTodos[0]
    const dueDate = new Date(nextTodo.dateScheduled!)
    const formattedDate = `${String(dueDate.getMonth() + 1).padStart(2, "0")}/${String(dueDate.getDate()).padStart(2, "0")}/${dueDate.getFullYear()}`
    return `${nextTodo.activity} (${formattedDate})`
  }

  const handleViewCase = (caseItem: (typeof cases)[0]) => {
    setCurrentCase(caseItem)
    onViewCase()
  }

  const uniqueCaseTypes = Array.from(new Set(cases.map((c) => c.caseType).filter(Boolean)))
  const uniqueManagers = Array.from(new Set(cases.map((c) => c.caseManager).filter(Boolean)))
  const uniqueLocations = Array.from(new Set(cases.map((c) => c.employeeLocation).filter(Boolean)))

  const handleSaveFilter = () => {
    if (!filterName.trim()) return

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      criteria: { ...advancedFilters },
    }

    setSavedFilters((prev) => [...prev, newFilter])
    setFilterName("")
    setShowSaveFilterDialog(false)
  }

  const handleLoadFilter = (filter: SavedFilter) => {
    setAdvancedFilters(filter.criteria)
    setActiveFilterId(filter.id)
    if (!showMoreFilters) {
      setSearchTerm(filter.criteria.search)
      setStatusFilter(filter.criteria.status)
    }
    setShowMoreFilters(true)
  }

  const handleDeleteFilter = (filterId: string) => {
    if (filterId === "my-cases" || filterId === "all-cases" || filterId === "unassigned") {
      return
    }
    setSavedFilters((prev) => prev.filter((f) => f.id !== filterId))
  }

  const handleClearFilters = () => {
    setAdvancedFilters({
      search: "",
      status: "all",
      caseType: "all",
      caseManager: "all",
      location: "all",
      dateCreatedFrom: "",
      dateCreatedTo: "",
    })
    setSearchTerm("")
    setStatusFilter("all")
    setActiveFilterId("all-cases")
  }

  return (
    <div className="dashboard-container container mx-auto p-6 max-w-[1400px]">
      <div className="dashboard-header mb-6">
        <h1 className="text-3xl font-bold mb-2">Cases Dashboard</h1>
        <p className="text-muted-foreground">View and manage all employee cases</p>
      </div>

      {/* Filters */}
      <div className="dashboard-filters bg-card rounded-lg shadow-sm border p-4 md:p-6 mb-6">
        {!showMoreFilters ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm">
                Search Cases
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, case number, or employee number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm">
                Filter by Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent justify-start sm:justify-center">
                    <Save className="h-4 w-4" />
                    <span className="sm:inline">
                      {savedFilters.find((f) => f.id === activeFilterId)?.name || "Saved Filters"}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-auto sm:ml-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-sm"
                    >
                      <button
                        onClick={() => handleLoadFilter(filter)}
                        className={`flex-1 text-left text-sm ${activeFilterId === filter.id ? "font-semibold text-primary" : ""}`}
                      >
                        {filter.name}
                      </button>
                      {filter.id !== "my-cases" && filter.id !== "all-cases" && filter.id !== "unassigned" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFilter(filter.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="gap-2 bg-transparent justify-start sm:justify-center"
                onClick={() => setShowMoreFilters(true)}
              >
                <Filter className="h-4 w-4" />
                <span className="sm:inline">More Filters</span>
              </Button>
            </div>
            {/* </CHANGE> */}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adv-search" className="text-sm">
                  Search Cases
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adv-search"
                    placeholder="Search by name, case number, or employee number..."
                    value={advancedFilters.search}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-status" className="text-sm">
                  Status
                </Label>
                <Select
                  value={advancedFilters.status}
                  onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, status: value })}
                >
                  <SelectTrigger id="adv-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
<SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-case-type" className="text-sm">
                  Case Type
                </Label>
                <Select
                  value={advancedFilters.caseType}
                  onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, caseType: value })}
                >
                  <SelectTrigger id="adv-case-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Case Types</SelectItem>
                    {uniqueCaseTypes
                      .filter((type) => 
                        type === "Occupational injury / illness" || 
                        type === "Non-occupational injury / illness"
                      )
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-manager" className="text-sm">
                  Case Manager
                </Label>
                <Select
                  value={advancedFilters.caseManager}
                  onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, caseManager: value })}
                >
                  <SelectTrigger id="adv-manager">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {uniqueManagers.map((manager) => (
                      <SelectItem key={manager} value={manager.toLowerCase()}>
                        {manager}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || advancedFilters.search) && (
                <div className="space-y-2">
                  <Label htmlFor="adv-location" className="text-sm">
                    Location
                  </Label>
                  <Select
                    value={advancedFilters.location}
                    onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, location: value })}
                  >
                    <SelectTrigger id="adv-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adv-date-from" className="text-sm">
                  Created From
                </Label>
                <Input
                  id="adv-date-from"
                  type="date"
                  value={advancedFilters.dateCreatedFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateCreatedFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-date-to" className="text-sm">
                  Created To
                </Label>
                <Input
                  id="adv-date-to"
                  type="date"
                  value={advancedFilters.dateCreatedTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateCreatedTo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2">
              <Button onClick={() => setShowMoreFilters(false)}>
                Show Less
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
                <Button onClick={() => setShowSaveFilterDialog(true)} className="gap-2">
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Filter</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cases Table */}
      <div className="dashboard-table phi-data pii-data bg-card rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort("caseNumber")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Case Number
                  {renderSortIcon("caseNumber")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("employeeName")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Employee Name
                  {renderSortIcon("employeeName")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("employeeNumber")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Employee Number{renderSortIcon("employeeNumber")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status
                  {renderSortIcon("status")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("caseType")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Case Type
                  {renderSortIcon("caseType")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("caseManager")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Case Manager
                  {renderSortIcon("caseManager")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("location")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Location
                  {renderSortIcon("location")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("dateOfDisability")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Date of Disability
                  {renderSortIcon("dateOfDisability")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("nextTodo")}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Next Todo
                  {renderSortIcon("nextTodo")}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No cases found
                </TableCell>
              </TableRow>
            ) : (
              sortedCases.map((caseItem) => (
                <TableRow
                  key={caseItem.caseNumber}
                  className="case-row phi-data pii-data cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewCase(caseItem)}
                >
                  <TableCell className="case-number-cell font-medium">{caseItem.caseNumber}</TableCell>
                  <TableCell className="employee-name-cell pii-data">{caseItem.employeeName}</TableCell>
                  <TableCell className="employee-number-cell pii-data text-muted-foreground">
                    {caseItem.employeeNumber}
                  </TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>{caseItem.caseType}</TableCell>
                  <TableCell className="text-muted-foreground">{caseItem.caseManager}</TableCell>
                  <TableCell className="text-muted-foreground">{caseItem.employeeLocation}</TableCell>
                  <TableCell className="text-muted-foreground">{caseItem.dateOfDisability ? (() => { const d = new Date(caseItem.dateOfDisability); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`; })() : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm" suppressHydrationWarning>{getNextTodo(caseItem)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-stats grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-card rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Cases</p>
          <p className="text-2xl font-bold">{cases.length}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground mb-1">Open Cases</p>
          <p className="text-2xl font-bold">{cases.filter((c) => c.status === "Open").length}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending Cases</p>
          <p className="text-2xl font-bold">{cases.filter((c) => c.status === "Pending").length}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-4">
          <p className="text-sm text-muted-foreground mb-1">Unassigned Cases</p>
          <p className="text-2xl font-bold">{cases.filter((c) => c.caseManager === "Unassigned").length}</p>
        </div>
      </div>

      <Dialog open={showSaveFilterDialog} onOpenChange={setShowSaveFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Give your filter configuration a name so you can quickly apply it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                placeholder="e.g., My Open Cases, Urgent Cases..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveFilterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

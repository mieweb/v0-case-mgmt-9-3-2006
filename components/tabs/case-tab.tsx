"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCases, type TodoItem } from "@/contexts/cases-context"
import { Button } from "@/components/ui/button"
import { useAdmin } from "@/contexts/admin-context"
import { generateTodosFromTemplates } from "@/lib/todo-parser"
import { useState, useEffect } from "react"
import { FolderOpen, Calendar } from "lucide-react"
import { CollapsibleSection } from "@/components/ui/collapsible-section"

export function CaseTab() {
  const { currentCase, updateCase, restrictions, updateRestriction } = useCases()
  const { caseTypes, codes, getCaseType, caseManagers } = useAdmin()

  const [status, setStatus] = useState("")
  const [caseType, setCaseType] = useState("")
  const [caseManager, setCaseManager] = useState(currentCase?.caseManager || "Unassigned")
  const [dateOfDisability, setDateOfDisability] = useState("")
  const [initialContactDate, setInitialContactDate] = useState("")
  const [dateClosed, setDateClosed] = useState("")
  const [closureReason, setClosureReason] = useState("")
  const [isConfidential, setIsConfidential] = useState(currentCase?.confidential || false)
  const [showConfidentialWarning, setShowConfidentialWarning] = useState(false)
  const [showCloseCaseDialog, setShowCloseCaseDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [selectedTodosToClose, setSelectedTodosToClose] = useState<string[]>([])
  const [selectedRestrictionsToClose, setSelectedRestrictionsToClose] = useState<string[]>([])
  
  // Get open items for current case
  const openTodos = currentCase?.todos?.filter((t) => !t.completed) || []
  const openRestrictions = restrictions.filter(
    (r) => r.caseNumber === currentCase?.caseNumber && r.isActive
  )

  useEffect(() => {
    if (currentCase) {
      setStatus(currentCase.status || "Open")
      setCaseType(currentCase.caseType || "")
      setCaseManager(currentCase.caseManager || "Unassigned")
      setIsConfidential(currentCase.confidential || false)
      setDateOfDisability(currentCase.dateOfDisability || "")
      setInitialContactDate(currentCase.initialContactDate || "")
      setDateClosed(currentCase.dateClosed || "")
      setClosureReason(currentCase.closureReason || "")
    }
  }, [currentCase])

  const handleFieldUpdate = (field: string, value: any) => {
    if (currentCase) {
      updateCase(currentCase.caseNumber, { [field]: value })
    }
  }

  const generateTodosFromDisabilityDate = (disabilityDate: string) => {
    if (!currentCase || !disabilityDate || !currentCase.caseType) return

    const caseTypeObj = getCaseType(currentCase.caseType)
    if (!caseTypeObj || !caseTypeObj.defaultTodos || caseTypeObj.defaultTodos.length === 0) return

    // Check if todos already exist to avoid duplicates
    if (currentCase.todos && currentCase.todos.length > 0) return

    const dates = {
      caseCreation: new Date(disabilityDate),
      surgeryDate: undefined,
      deliveryDate: currentCase.deliveryDate ? new Date(currentCase.deliveryDate) : undefined,
    }

    const parsedTodos = generateTodosFromTemplates(caseTypeObj.defaultTodos, dates)

    const newTodos: TodoItem[] = parsedTodos.map((pt, index) => ({
      id: `${Date.now()}-${index}`,
      dateScheduled: pt.dueDate ? pt.dueDate.toISOString().split("T")[0] : "",
      dateCompleted: "",
      dateClosed: "",
      activity: pt.activity,
      assignedTo: currentCase.caseManager || "Unassigned",
      completed: false,
      notes: "",
    }))

    updateCase(currentCase.caseNumber, { todos: newTodos })
  }

  const handleConfidentialChange = (checked: boolean) => {
    if (checked) {
      setShowConfidentialWarning(true)
    } else {
      setIsConfidential(false)
      handleFieldUpdate("confidential", false)
    }
  }

  const confirmConfidential = () => {
    setIsConfidential(true)
    handleFieldUpdate("confidential", true)
    setShowConfidentialWarning(false)
  }

  if (!currentCase) {
    return <div className="case-tab-no-data p-6 text-center text-muted-foreground">No case selected</div>
  }

  return (
    <div className="case-tab-container phi-data space-y-4">
      <CollapsibleSection title="Case Information" icon={<FolderOpen className="h-4 w-4" />} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm text-muted-foreground">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                handleFieldUpdate("status", val)
              }}
            >
              <SelectTrigger id="status" className="bg-background">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {codes.caseStatus
                  .filter((s) => s.active && s.description !== "Closed")
                  .map((statusCode) => (
                    <SelectItem key={statusCode.id} value={statusCode.description}>
                      {statusCode.description}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-type" className="text-sm text-muted-foreground">
              Case type
            </Label>
            <Select
              value={caseType}
              onValueChange={(val) => {
                setCaseType(val)
                handleFieldUpdate("caseType", val)
              }}
            >
              <SelectTrigger id="case-type" className="bg-background">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {caseTypes.map((type) => {
                  const displayName = type.name.includes(" — ") ? type.name.split(" — ")[1] : type.name
                  return (
                    <SelectItem key={type.id} value={type.name}>
                      {displayName}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-manager" className="text-sm text-muted-foreground">
              Case manager
            </Label>
            <Select
              value={caseManager}
              onValueChange={(val) => {
                setCaseManager(val)
                handleFieldUpdate("caseManager", val)
              }}
            >
              <SelectTrigger id="case-manager" className="bg-background">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
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

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confidential-case"
              checked={isConfidential}
              onChange={(e) => handleConfidentialChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="confidential-case" className="text-sm font-medium cursor-pointer">
              Mark as Confidential Case
            </Label>
          </div>
          <Button
            type="button"
            variant={status === "Closed" ? "secondary" : "destructive"}
            size="sm"
            disabled={status === "Closed"}
            onClick={() => {
              if (openTodos.length > 0 || openRestrictions.length > 0) {
                setPendingStatus("Closed")
                setSelectedTodosToClose([])
                setSelectedRestrictionsToClose([])
                setShowCloseCaseDialog(true)
              } else {
                setStatus("Closed")
                handleFieldUpdate("status", "Closed")
              }
            }}
          >
            {status === "Closed" ? "Case Closed" : "Close Case"}
          </Button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Case Dates" icon={<Calendar className="h-4 w-4" />} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-disability" className="text-sm text-muted-foreground">
              Date of disability
            </Label>
            <Input
              id="date-disability"
              type="date"
              className="bg-background"
              value={dateOfDisability}
              onChange={(e) => {
                setDateOfDisability(e.target.value)
                handleFieldUpdate("dateOfDisability", e.target.value)
                if (e.target.value) {
                  generateTodosFromDisabilityDate(e.target.value)
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial-contact" className="text-sm text-muted-foreground">
              Initial contact date
            </Label>
            <Input
              id="initial-contact"
              type="date"
              className="bg-background"
              value={initialContactDate}
              onChange={(e) => {
                setInitialContactDate(e.target.value)
                handleFieldUpdate("initialContactDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-closed" className="text-sm text-muted-foreground">
              Date closed
            </Label>
            <Input
              id="date-closed"
              type="date"
              className="bg-background"
              value={dateClosed}
              onChange={(e) => {
                setDateClosed(e.target.value)
                handleFieldUpdate("dateClosed", e.target.value)
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="closure-reason" className="text-sm text-muted-foreground">
              Closure reason
            </Label>
            <Select
              value={closureReason}
              onValueChange={(val) => {
                setClosureReason(val)
                handleFieldUpdate("closureReason", val)
              }}
            >
              <SelectTrigger id="closure-reason" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {codes.caseClosureReason
                  .filter((c) => c.active)
                  .map((reason) => (
                    <SelectItem key={reason.id} value={reason.code}>
                      {reason.description || reason.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      <AlertDialog open={showConfidentialWarning} onOpenChange={setShowConfidentialWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Case as Confidential?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="font-semibold text-destructive">Warning: You will lose access to this case!</div>
              <div>
                Marking this case as confidential will restrict access to administrators only. As a case manager, you
                will no longer be able to view or edit this case unless it is unmarked as confidential by an
                administrator.
              </div>
              <div>Are you sure you want to continue?</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConfidential} className="bg-destructive hover:bg-destructive/90">
              Mark as Confidential
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Case Dialog - Shows open restrictions and todos */}
      <AlertDialog open={showCloseCaseDialog} onOpenChange={setShowCloseCaseDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Close Case - Review Open Items</AlertDialogTitle>
            <AlertDialogDescription>
              This case has open items that should be reviewed before closing. 
              Select items to close them along with the case, or leave unchecked to keep them open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {openTodos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Open To-Dos ({openTodos.length})</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTodosToClose(openTodos.map((t) => t.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTodosToClose([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {openTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <Checkbox
                        id={`todo-${todo.id}`}
                        checked={selectedTodosToClose.includes(todo.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTodosToClose((prev) => [...prev, todo.id])
                          } else {
                            setSelectedTodosToClose((prev) => prev.filter((id) => id !== todo.id))
                          }
                        }}
                      />
                      <label htmlFor={`todo-${todo.id}`} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{todo.activity}</span>
                        {todo.dateScheduled && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            Due: {todo.dateScheduled}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openRestrictions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Active Restrictions ({openRestrictions.length})</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRestrictionsToClose(openRestrictions.map((r) => r.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRestrictionsToClose([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {openRestrictions.map((restriction) => (
                    <div key={restriction.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <Checkbox
                        id={`restriction-${restriction.id}`}
                        checked={selectedRestrictionsToClose.includes(restriction.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRestrictionsToClose((prev) => [...prev, restriction.id])
                          } else {
                            setSelectedRestrictionsToClose((prev) => prev.filter((id) => id !== restriction.id))
                          }
                        }}
                      />
                      <label htmlFor={`restriction-${restriction.id}`} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{restriction.restriction}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          Started: {restriction.startDate}
                          {restriction.isPermanent ? " (Permanent)" : restriction.endDate ? ` - Ends: ${restriction.endDate}` : ""}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="border-t pt-4">
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Close selected todos
                if (currentCase && selectedTodosToClose.length > 0) {
                  const updatedTodos = currentCase.todos?.map((todo) => {
                    if (selectedTodosToClose.includes(todo.id)) {
                      return { ...todo, completed: true, dateClosed: new Date().toISOString().split("T")[0] }
                    }
                    return todo
                  })
                  updateCase(currentCase.caseNumber, { todos: updatedTodos })
                }

                // Close selected restrictions
                selectedRestrictionsToClose.forEach((restrictionId) => {
                  updateRestriction(restrictionId, { 
                    isActive: false, 
                    endDate: new Date().toISOString().split("T")[0] 
                  })
                })

                // Update case status
                if (pendingStatus) {
                  setStatus(pendingStatus)
                  handleFieldUpdate("status", pendingStatus)
                }

                setShowCloseCaseDialog(false)
                setPendingStatus(null)
              }}
            >
              Close Case
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

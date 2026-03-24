"use client"

import { useState, useEffect, useMemo } from "react"
import { useAdmin } from "@/contexts/admin-context"
import { useUser, type SecurityRole } from "@/contexts/user-context"
import { useEmployees, type Employee } from "@/contexts/employees-context"
import { useCases, type AbsenceEntry } from "@/contexts/cases-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Check, X, TestTube, AlertTriangle, Info, FileBarChart, Calendar, Users, Filter } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateTodosFromTemplates, type ParsedTodo } from "@/lib/todo-parser"
import { TodoTemplateBuilder, TodoTemplateHelp } from "@/components/todo-template-builder"
import { LetterTemplateManager } from "@/components/letter-template-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

interface AdminPanelProps {
  activeSection?: string
}

export function AdminPanel({ activeSection: initialSection = "work-status-report" }: AdminPanelProps) {
  console.log("[v0] AdminPanel rendered with initialSection:", initialSection)
  const [activeSection, setActiveSection] = useState(initialSection)
  const { caseTypes, addCaseType, updateCaseType, deleteCaseType, codes, addCode, updateCode, deleteCode } = useAdmin()
  const { users, addUser, updateUser, deleteUser } = useUser()
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees()

  const [newCaseTypeName, setNewCaseTypeName] = useState("")
  const [newTodoItems, setNewTodoItems] = useState("")
  const [editingCaseType, setEditingCaseType] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editTodos, setEditTodos] = useState("")
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testCaseTypeId, setTestCaseTypeId] = useState<string | null>(null)
  const [testAnchorDates, setTestAnchorDates] = useState({
    caseCreation: new Date(),
    surgeryDate: "",
    deliveryDate: "",
  })
  const [generatedTodos, setGeneratedTodos] = useState<ParsedTodo[]>([])

  useEffect(() => {
    setActiveSection(initialSection)
  }, [initialSection])

  const handleAddCaseType = () => {
    if (!newCaseTypeName.trim()) return

    const todoList = newTodoItems
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    addCaseType({
      name: newCaseTypeName.trim(),
      defaultTodos: todoList,
    })

    setNewCaseTypeName("")
    setNewTodoItems("")
  }

  const handleStartEdit = (caseType: { id: string; name: string; defaultTodos: string[] }) => {
    setEditingCaseType(caseType.id)
    setEditName(caseType.name)
    setEditTodos(caseType.defaultTodos.join("\n"))
  }

  const handleSaveEdit = () => {
    if (!editingCaseType || !editName.trim()) return

    const todoList = editTodos
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    updateCaseType(editingCaseType, {
      name: editName.trim(),
      defaultTodos: todoList,
    })

    setEditingCaseType(null)
    setEditName("")
    setEditTodos("")
  }

  const handleCancelEdit = () => {
    setEditingCaseType(null)
    setEditName("")
    setEditTodos("")
  }

  const handleTestTodoLogic = (caseTypeId: string) => {
    setTestCaseTypeId(caseTypeId)
    setTestDialogOpen(true)
    setTestAnchorDates({
      caseCreation: new Date(),
      surgeryDate: "",
      deliveryDate: "",
    })
    setGeneratedTodos([])
  }

  const handleGenerateTodos = () => {
    if (!testCaseTypeId) return

    const caseType = caseTypes.find((ct) => ct.id === testCaseTypeId)
    if (!caseType) return

    const anchorDates = {
      caseCreation: testAnchorDates.caseCreation,
      surgeryDate: testAnchorDates.surgeryDate ? new Date(testAnchorDates.surgeryDate) : undefined,
      deliveryDate: testAnchorDates.deliveryDate ? new Date(testAnchorDates.deliveryDate) : undefined,
    }

    const todos = generateTodosFromTemplates(caseType.defaultTodos, anchorDates)
    setGeneratedTodos(todos)
  }

  return (
    <div className="admin-panel-container container mx-auto max-w-[1400px] py-8 px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage system configuration and code tables</p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="work-status-report">Work Status Report</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="case-managers">Case Managers</TabsTrigger>
          <TabsTrigger value="case-types">Case Types</TabsTrigger>
          <TabsTrigger value="letter-templates">Letter Templates</TabsTrigger>
          <TabsTrigger value="case-status-codes">Case Status</TabsTrigger>
          <TabsTrigger value="case-category-codes">Case Category</TabsTrigger>
          <TabsTrigger value="case-closure-reason-codes">Closure Reason</TabsTrigger>
          <TabsTrigger value="contact-type-codes">Contact Type</TabsTrigger>
          <TabsTrigger value="absence-status-codes">Absence Status</TabsTrigger>
          <TabsTrigger value="absence-reason-codes">Absence Reason</TabsTrigger>
          <TabsTrigger value="restriction-codes">Restrictions</TabsTrigger>
          <TabsTrigger value="case-activity-codes">Case Activity</TabsTrigger>
          <TabsTrigger value="document-type-codes">Document Type</TabsTrigger>
        </TabsList>

        <TabsContent value="work-status-report" className="space-y-6">
          {(() => { console.log("[v0] Rendering TabsContent for work-status-report"); return null; })()}
          <WorkStatusReport />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <EmployeeUserManager
            employees={employees}
            onAdd={addEmployee}
            onUpdate={updateEmployee}
            onDelete={deleteEmployee}
          />
        </TabsContent>

        <TabsContent value="case-managers" className="space-y-6">
          <CaseManagerManager />
        </TabsContent>

        <TabsContent value="case-types" className="space-y-6">
          {/* Add New Case Type */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Case Type</CardTitle>
              <CardDescription>
                Create a new case type with default todo items that will be assigned to new cases of this type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="case-type-name">Case Type Name</Label>
                <Input
                  id="case-type-name"
                  placeholder="e.g., Short-term Disability"
                  value={newCaseTypeName}
                  onChange={(e) => setNewCaseTypeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-todos">Default Todo Items (one per line)</Label>
                <div className="flex gap-2 mb-2">
                  <TodoTemplateBuilder
                    onInsert={(template) => setNewTodoItems((prev) => (prev ? `${prev}\n${template}` : template))}
                  />
                  <TodoTemplateHelp />
                </div>
                <Textarea
                  id="default-todos"
                  placeholder="e.g.,&#10;Request medical documentation&#10;Review claim eligibility&#10;Contact employee&#10;Schedule follow-up"
                  rows={6}
                  value={newTodoItems}
                  onChange={(e) => setNewTodoItems(e.target.value)}
                />
              </div>
              <Button onClick={handleAddCaseType} disabled={!newCaseTypeName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Case Type
              </Button>
            </CardContent>
          </Card>

          {/* Existing Case Types */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Case Types</CardTitle>
              <CardDescription>Manage and edit your case type templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {caseTypes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No case types defined yet. Add your first case type above.
                  </p>
                ) : (
                  caseTypes.map((caseType) => (
                    <div key={caseType.id} className="border rounded-lg p-4 space-y-3">
                      {editingCaseType === caseType.id ? (
                        // Edit Mode
                        <>
                          <div className="space-y-2">
                            <Label>Case Type Name</Label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Default Todo Items (one per line)</Label>
                            <div className="flex gap-2 mb-2">
                              <TodoTemplateBuilder
                                onInsert={(template) =>
                                  setEditTodos((prev) => (prev ? `${prev}\n${template}` : template))
                                }
                              />
                              <TodoTemplateHelp />
                            </div>
                            <Textarea rows={6} value={editTodos} onChange={(e) => setEditTodos(e.target.value)} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium text-lg">{caseType.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {caseType.defaultTodos.length} default todo
                                {caseType.defaultTodos.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Dialog
                                open={testDialogOpen && testCaseTypeId === caseType.id}
                                onOpenChange={setTestDialogOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => handleTestTodoLogic(caseType.id)}>
                                    <TestTube className="h-4 w-4 mr-2" />
                                    Test
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Test Todo Logic: {caseType.name}</DialogTitle>
                                    <DialogDescription>
                                      Set anchor dates to preview the generated todo list
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label>Case Creation Date</Label>
                                        <Input
                                          type="date"
                                          value={format(testAnchorDates.caseCreation, "yyyy-MM-dd")}
                                          onChange={(e) =>
                                            setTestAnchorDates((prev) => ({
                                              ...prev,
                                              caseCreation: new Date(e.target.value),
                                            }))
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Surgery Date (optional)</Label>
                                        <Input
                                          type="date"
                                          value={testAnchorDates.surgeryDate}
                                          onChange={(e) =>
                                            setTestAnchorDates((prev) => ({
                                              ...prev,
                                              surgeryDate: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Delivery Date (optional)</Label>
                                        <Input
                                          type="date"
                                          value={testAnchorDates.deliveryDate}
                                          onChange={(e) =>
                                            setTestAnchorDates((prev) => ({
                                              ...prev,
                                              deliveryDate: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                    <Button onClick={handleGenerateTodos}>Generate Todo Preview</Button>

                                    {generatedTodos.length > 0 && (
                                      <div className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">Generated Todos ({generatedTodos.length})</h4>
                                        <div className="space-y-2">
                                          {generatedTodos.map((todo, index) => (
                                            <div key={index} className="border-b pb-2 last:border-b-0">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <p className="font-medium">{todo.title}</p>
                                                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                                                </div>
                                                <p className="text-sm font-medium">
                                                  {format(todo.dueDate, "MMM d, yyyy")}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="outline" onClick={() => handleStartEdit(caseType)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteCaseType(caseType.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {caseType.defaultTodos.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Default Todos:</p>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {caseType.defaultTodos.map((todo, index) => (
                                  <li key={index}>{todo}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="letter-templates" className="space-y-6">
          <LetterTemplateManager
            templates={codes.letterTemplates}
            onAdd={(template) => addCode("letterTemplates", template)}
            onUpdate={(id, updates) => updateCode("letterTemplates", id, updates)}
            onDelete={(id) => deleteCode("letterTemplates", id)}
          />
        </TabsContent>

        <TabsContent value="case-status-codes" className="space-y-6">
          <CodeTableManager
            title="Case Status Codes"
            description="Manage case status values"
            codes={codes.caseStatus}
            onAdd={(code) => addCode("caseStatus", code)}
            onUpdate={(id, code) => updateCode("caseStatus", id, code)}
            onDelete={(id) => deleteCode("caseStatus", id)}
          />
        </TabsContent>

        <TabsContent value="case-category-codes" className="space-y-6">
          <CodeTableManager
            title="Case Category Codes"
            description="Manage case category classifications"
            codes={codes.caseCategory}
            onAdd={(code) => addCode("caseCategory", code)}
            onUpdate={(id, code) => updateCode("caseCategory", id, code)}
            onDelete={(id) => deleteCode("caseCategory", id)}
            hasDescription
          />
        </TabsContent>

        <TabsContent value="case-closure-reason-codes" className="space-y-6">
          <CodeTableManager
            title="Case Closure Reason Codes"
            description="Manage reasons for case closure"
            codes={codes.caseClosureReason}
            onAdd={(code) => addCode("caseClosureReason", code)}
            onUpdate={(id, code) => updateCode("caseClosureReason", id, code)}
            onDelete={(id) => deleteCode("caseClosureReason", id)}
            hasDescription
          />
        </TabsContent>

        <TabsContent value="contact-type-codes" className="space-y-6">
          <CodeTableManager
            title="Contact Type Codes"
            description="Manage contact relationship types"
            codes={codes.contactType}
            onAdd={(code) => addCode("contactType", code)}
            onUpdate={(id, code) => updateCode("contactType", id, code)}
            onDelete={(id) => deleteCode("contactType", id)}
            hasDescription
          />
        </TabsContent>

        <TabsContent value="absence-status-codes" className="space-y-6">
          <CodeTableManager
            title="Absence Status Codes"
            description="Manage absence status values"
            codes={codes.absenceStatus}
            onAdd={(code) => addCode("absenceStatus", code)}
            onUpdate={(id, code) => updateCode("absenceStatus", id, code)}
            onDelete={(id) => deleteCode("absenceStatus", id)}
          />
        </TabsContent>

        <TabsContent value="absence-reason-codes" className="space-y-6">
          <CodeTableManager
            title="Absence Reason Codes"
            description="Manage absence reason classifications"
            codes={codes.absenceReason}
            onAdd={(code) => addCode("absenceReason", code)}
            onUpdate={(id, code) => updateCode("absenceReason", id, code)}
            onDelete={(id) => deleteCode("absenceReason", id)}
            hasDescription
          />
        </TabsContent>

        <TabsContent value="restriction-codes" className="space-y-6">
          <CodeTableManager
            title="Restriction Codes"
            description="Manage work restriction types"
            codes={codes.restrictionCodes}
            onAdd={(code) => addCode("restrictionCodes", code)}
            onUpdate={(id, code) => updateCode("restrictionCodes", id, code)}
            onDelete={(id) => deleteCode("restrictionCodes", id)}
            hasDescription
          />
        </TabsContent>

        <TabsContent value="case-activity-codes" className="space-y-6">
          <CodeTableManager
            title="Case Activity Codes"
            description="Manage case activity types for notes and history"
            codes={codes.caseActivity}
            onAdd={(code) => addCode("caseActivity", code)}
            onUpdate={(id, code) => updateCode("caseActivity", id, code)}
            onDelete={(id) => deleteCode("caseActivity", id)}
            hasDescription
          />
        </TabsContent>

        <TabsContent value="document-type-codes" className="space-y-6">
          <CodeTableManager
            title="Document Type Codes"
            description="Manage document classification types"
            codes={codes.documentType}
            onAdd={(code) => addCode("documentType", code)}
            onUpdate={(id, code) => updateCode("documentType", id, code)}
            onDelete={(id) => deleteCode("documentType", id)}
            hasDescription
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface Code {
  id: string
  code: string
  description?: string
  active: boolean
}

interface CodeTableManagerProps {
  title: string
  description: string
  codes: Code[]
  onAdd: (code: Omit<Code, "id">) => void
  onUpdate: (id: string, code: Partial<Omit<Code, "id">>) => void
  onDelete: (id: string) => void
  hasDescription?: boolean
}

function CodeTableManager({
  title,
  description,
  codes,
  onAdd,
  onUpdate,
  onDelete,
  hasDescription = false,
}: CodeTableManagerProps) {
  const [newCode, setNewCode] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editActive, setEditActive] = useState(true)

  const handleAdd = () => {
    if (!newCode.trim()) return
    onAdd({
      code: newCode.trim(),
      description: hasDescription ? newDescription.trim() : undefined,
      active: true,
    })
    setNewCode("")
    setNewDescription("")
  }

  const handleStartEdit = (code: Code) => {
    setEditingId(code.id)
    setEditCode(code.code)
    setEditDescription(code.description || "")
    setEditActive(code.active)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editCode.trim()) return
    onUpdate(editingId, {
      code: editCode.trim(),
      description: hasDescription ? editDescription.trim() : undefined,
      active: editActive,
    })
    setEditingId(null)
    setEditCode("")
    setEditDescription("")
    setEditActive(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditCode("")
    setEditDescription("")
    setEditActive(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New {title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="Enter code..." value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            </div>
            {hasDescription && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Enter description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            )}
          </div>
          <Button onClick={handleAdd} disabled={!newCode.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Code
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing {title}</CardTitle>
          <CardDescription>Manage your code values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {codes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No codes defined yet. Add your first code above.</p>
            ) : (
              codes.map((code) => (
                <div key={code.id} className="border rounded-lg p-3">
                  {editingId === code.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} />
                        </div>
                        {hasDescription && (
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{code.code}</span>
                          {!code.active && <span className="text-xs px-2 py-0.5 bg-muted rounded">Inactive</span>}
                        </div>
                        {hasDescription && code.description && (
                          <p className="text-sm text-muted-foreground mt-1">{code.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(code)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onDelete(code.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

interface EmployeeUserManagerProps {
  employees: Employee[]
  onAdd: (employee: Employee) => void
  onUpdate: (id: string, updates: Partial<Employee>) => void
  onDelete: (id: string) => void
}

function EmployeeUserManager({ employees, onAdd, onUpdate, onDelete }: EmployeeUserManagerProps) {
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newRole, setNewRole] = useState<SecurityRole | undefined>(undefined)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editNumber, setEditNumber] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editRole, setEditRole] = useState<SecurityRole | undefined>(undefined)
  const [editActive, setEditActive] = useState(true)

  const handleAdd = () => {
    if (!newName.trim() || !newNumber.trim() || !newLocation.trim()) return
    onAdd({
      name: newName.trim(),
      number: newNumber.trim(),
      email: newEmail.trim() || undefined,
      location: newLocation.trim(),
      role: newRole,
      active: true,
    })
    setNewName("")
    setNewNumber("")
    setNewEmail("")
    setNewLocation("")
    setNewRole(undefined)
  }

  const handleStartEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setEditName(emp.name)
    setEditNumber(emp.number)
    setEditEmail(emp.email || "")
    setEditLocation(emp.location)
    setEditRole(emp.role)
    setEditActive(emp.active)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim() || !editNumber.trim() || !editLocation.trim()) return
    onUpdate(editingId, {
      name: editName.trim(),
      number: editNumber.trim(),
      email: editEmail.trim() || undefined,
      location: editLocation.trim(),
      role: editRole,
      active: editActive,
    })
    setEditingId(null)
    setEditName("")
    setEditNumber("")
    setEditEmail("")
    setEditLocation("")
    setEditRole(undefined)
    setEditActive(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditNumber("")
    setEditEmail("")
    setEditLocation("")
    setEditRole(undefined)
    setEditActive(true)
  }

  const getRoleBadgeVariant = (role?: SecurityRole) => {
    switch (role) {
      case "admin":
        return "default"
      case "case-manager-leader":
        return "default"
      case "case-manager":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Assign security roles to employees for system access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Employee # *</Label>
              <Input placeholder="EMP-12345" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="user@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input placeholder="Toledo, OH" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Security Role</Label>
            <Select
              value={newRole || "none"}
              onValueChange={(value) => setNewRole(value === "none" ? undefined : (value as SecurityRole))}
            >
              <SelectTrigger>
                <SelectValue placeholder="No system access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No system access</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="case-manager-leader">Case Manager Leader</SelectItem>
                <SelectItem value="case-manager">Case Manager</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!newName.trim() || !newNumber.trim() || !newLocation.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee System Access</CardTitle>
          <CardDescription>Manage employee security roles and system access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No employees defined yet.</p>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className="border rounded-lg p-3 pii-data">
                  {editingId === emp.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Employee #</Label>
                          <Input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Security Role</Label>
                        <Select
                          value={editRole || "none"}
                          onValueChange={(value) => setEditRole(value === "none" ? undefined : (value as SecurityRole))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No system access</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="case-manager">Case Manager</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{emp.name}</span>
                          <span className="text-sm text-muted-foreground">({emp.number})</span>
                          {emp.role ? (
                            <Badge variant={getRoleBadgeVariant(emp.role)}>{emp.role}</Badge>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                              No Access
                            </span>
                          )}
                          {!emp.active && <span className="text-xs px-2 py-0.5 bg-muted rounded">Inactive</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {emp.email && <span>{emp.email}</span>}
                          <span>•</span>
                          <span>{emp.location}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(emp)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onUpdate(emp.id, { active: !emp.active })}>
                          {emp.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function CaseManagerManager() {
  const { caseManagers, addCaseManager, updateCaseManager, deleteCaseManager } = useAdmin()
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editActive, setEditActive] = useState(true)

  const handleAdd = () => {
    if (!newName.trim()) return
    addCaseManager({
      name: newName.trim(),
      active: true,
    })
    setNewName("")
  }

  const handleStartEdit = (cm: { id: string; name: string; active: boolean }) => {
    setEditingId(cm.id)
    setEditName(cm.name)
    setEditActive(cm.active)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateCaseManager(editingId, {
      name: editName.trim(),
      active: editActive,
    })
    setEditingId(null)
    setEditName("")
    setEditActive(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditActive(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New Case Manager</CardTitle>
          <CardDescription>Add case managers who can be assigned to cases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Jane Smith, RN, CCM"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={!newName.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Case Manager
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Case Managers</CardTitle>
          <CardDescription>Manage case managers available for case assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {caseManagers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No case managers defined yet. Add your first case manager above.
              </p>
            ) : (
              caseManagers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((cm) => (
                  <div key={cm.id} className="border rounded-lg p-3">
                    {editingId === cm.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm">Active</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cm.name}</span>
                          {!cm.active && <span className="text-xs px-2 py-0.5 bg-muted rounded">Inactive</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleStartEdit(cm)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteCaseManager(cm.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Helper to get normalized status code
function getStatusCode(status: string): string {
  if (status.startsWith("FD")) return "FD"
  if (status.startsWith("LWD")) return "LWD"
  if (status.startsWith("RWD") && !status.startsWith("RWDREGULARJOB")) return "RWD"
  if (status.startsWith("RWDREGULARJOB")) return "RWDREGULARJOB"
  if (status.startsWith("OTH")) return "OTH"
  return status.split(" ")[0] || status
}

type AuditIssue = {
  type: "consecutive" | "gap" | "overlap"
  severity: "error" | "warning"
  message: string
  caseNumber: string
  employeeName: string
  entryIds: string[]
}

function WorkStatusReport() {
  console.log("[v0] WorkStatusReport function starting")
  const casesContext = useCases()
  console.log("[v0] useCases returned:", casesContext)
  const { cases } = casesContext
  const { codes } = useAdmin()
  
  console.log("[v0] WorkStatusReport rendered, cases count:", cases?.length)
  
  // Date range filter state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showIssuesOnly, setShowIssuesOnly] = useState(false)
  
  // Flatten all absence entries across all cases
  const allEntries = useMemo(() => {
    const entries: Array<AbsenceEntry & { caseNumber: string; employeeName: string; employeeNumber: string; caseType: string; caseStatus: string }> = []
    
    for (const c of cases) {
      if (!c.absences || c.absences.length === 0) continue
      
      for (const absence of c.absences) {
        entries.push({
          ...absence,
          caseNumber: c.caseNumber,
          employeeName: c.employeeName,
          employeeNumber: c.employeeNumber,
          caseType: c.caseType,
          caseStatus: c.status,
        })
      }
    }
    
    return entries.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
  }, [cases])
  
  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const entryDate = entry.effectiveDate
      const inDateRange = entryDate >= startDate && entryDate <= endDate
      const matchesStatus = statusFilter === "all" || getStatusCode(entry.status) === statusFilter
      return inDateRange && matchesStatus
    })
  }, [allEntries, startDate, endDate, statusFilter])
  
  // Audit: detect timeline issues across all cases
  const auditIssues = useMemo(() => {
    const issues: AuditIssue[] = []
    
    // Group entries by case
    const entriesByCase = new Map<string, Array<AbsenceEntry & { caseNumber: string; employeeName: string }>>()
    for (const entry of allEntries) {
      if (!entriesByCase.has(entry.caseNumber)) {
        entriesByCase.set(entry.caseNumber, [])
      }
      entriesByCase.get(entry.caseNumber)!.push(entry)
    }
    
    // Check each case for issues
    for (const [caseNumber, entries] of entriesByCase) {
      const sorted = entries.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
      const employeeName = entries[0]?.employeeName || "Unknown"
      
      // Check for consecutive same-status entries
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const prevStatus = getStatusCode(prev.status)
        const currStatus = getStatusCode(curr.status)
        
        if (prevStatus === currStatus && (prevStatus === "RWD" || prevStatus === "FD" || prevStatus === "LWD")) {
          const statusLabel = codes.absenceStatus.find((c) => c.code === prevStatus)?.description || prevStatus
          issues.push({
            type: "consecutive",
            severity: "error",
            message: `Consecutive "${statusLabel}" entries on ${prev.effectiveDate} and ${curr.effectiveDate}`,
            caseNumber,
            employeeName,
            entryIds: [prev.id, curr.id],
          })
        }
      }
      
      // Check for gaps
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const prevDate = new Date(prev.effectiveDate.replace(/-/g, "/"))
        const currDate = new Date(curr.effectiveDate.replace(/-/g, "/"))
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays > 7) {
          issues.push({
            type: "gap",
            severity: "warning",
            message: `${diffDays} day gap between ${prev.effectiveDate} and ${curr.effectiveDate}`,
            caseNumber,
            employeeName,
            entryIds: [prev.id, curr.id],
          })
        }
      }
      
      // Check for duplicate same-date same-status
      const dateStatusMap = new Map<string, AbsenceEntry[]>()
      for (const entry of sorted) {
        const key = `${entry.effectiveDate}-${getStatusCode(entry.status)}`
        if (!dateStatusMap.has(key)) {
          dateStatusMap.set(key, [])
        }
        dateStatusMap.get(key)!.push(entry)
      }
      
      for (const [key, dupes] of dateStatusMap) {
        if (dupes.length > 1) {
          const [date, status] = key.split("-")
          issues.push({
            type: "overlap",
            severity: "error",
            message: `Duplicate ${status} entries on ${date}`,
            caseNumber,
            employeeName,
            entryIds: dupes.map((d) => d.id),
          })
        }
      }
    }
    
    return issues
  }, [allEntries, codes.absenceStatus])
  
  // Summary counts
  const summary = useMemo(() => {
    const counts = { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0, total: 0 }
    const uniqueEmployees = new Set<string>()
    const uniqueCases = new Set<string>()
    
    for (const entry of filteredEntries) {
      const statusCode = getStatusCode(entry.status)
      if (statusCode in counts) {
        counts[statusCode as keyof typeof counts] += 1
      }
      counts.total += 1
      uniqueEmployees.add(entry.employeeNumber)
      uniqueCases.add(entry.caseNumber)
    }
    
    return { counts, employeeCount: uniqueEmployees.size, caseCount: uniqueCases.size }
  }, [filteredEntries])
  
  // Cases with issues in filtered range
  const casesWithIssues = useMemo(() => {
    const issueEntryIds = new Set(auditIssues.flatMap((i) => i.entryIds))
    return filteredEntries.filter((e) => issueEntryIds.has(e.id))
  }, [filteredEntries, auditIssues])
  
  const displayEntries = showIssuesOnly ? casesWithIssues : filteredEntries

  console.log("[v0] WorkStatusReport about to return JSX")
  
  return (
    <>
      <div className="p-4 bg-blue-100 text-blue-900 rounded mb-4">
        [DEBUG] WorkStatusReport is rendering. Cases count: {cases?.length ?? 0}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Work Status Report
          </CardTitle>
          <CardDescription>
            System-wide view of work status entries across all cases. Identify who is out and detect timeline validation issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {codes.absenceStatus.filter((c) => c.active).map((status) => (
                    <SelectItem key={status.id} value={status.code}>
                      {status.code} - {status.description || status.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                id="issues-only"
                checked={showIssuesOnly}
                onChange={(e) => setShowIssuesOnly(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="issues-only" className="text-sm cursor-pointer">
                Show issues only
              </Label>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-background border rounded-lg">
              <div className="text-2xl font-semibold">{summary.caseCount}</div>
              <div className="text-sm text-muted-foreground">Cases</div>
            </div>
            <div className="p-4 bg-background border rounded-lg">
              <div className="text-2xl font-semibold">{summary.employeeCount}</div>
              <div className="text-sm text-muted-foreground">Employees</div>
            </div>
            <div className="p-4 bg-background border rounded-lg">
              <div className="text-2xl font-semibold text-red-600">{summary.counts.LWD}</div>
              <div className="text-sm text-muted-foreground">Lost Work Days</div>
            </div>
            <div className="p-4 bg-background border rounded-lg">
              <div className="text-2xl font-semibold text-amber-600">{summary.counts.RWD}</div>
              <div className="text-sm text-muted-foreground">Restricted Days</div>
            </div>
            <div className="p-4 bg-background border rounded-lg">
              <div className="text-2xl font-semibold text-green-600">{summary.counts.FD}</div>
              <div className="text-sm text-muted-foreground">Full Duty</div>
            </div>
          </div>
          
          {/* Audit Issues Summary */}
          {auditIssues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Audit Issues ({auditIssues.length} issue{auditIssues.length !== 1 ? "s" : ""} across all cases)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {auditIssues.filter((i) => i.severity === "error").slice(0, 10).map((issue, idx) => (
                  <Alert key={`error-${idx}`} variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{issue.employeeName}</span> ({issue.caseNumber}): {issue.message}
                    </AlertDescription>
                  </Alert>
                ))}
                {auditIssues.filter((i) => i.severity === "warning").slice(0, 5).map((issue, idx) => (
                  <Alert key={`warning-${idx}`} className="py-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-medium">{issue.employeeName}</span> ({issue.caseNumber}): {issue.message}
                    </AlertDescription>
                  </Alert>
                ))}
                {auditIssues.length > 15 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {auditIssues.length - 15} more issues
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Entries Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Case #</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Case Status</TableHead>
                  <TableHead className="text-center">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No entries found for the selected date range and filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayEntries.map((entry) => {
                    const entryIssues = auditIssues.filter((i) => i.entryIds.includes(entry.id))
                    const hasError = entryIssues.some((i) => i.severity === "error")
                    const hasWarning = entryIssues.some((i) => i.severity === "warning")
                    
                    return (
                      <TableRow
                        key={`${entry.caseNumber}-${entry.id}`}
                        className={hasError ? "bg-red-50 dark:bg-red-950/20" : hasWarning ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                      >
                        <TableCell className="font-mono text-sm">{entry.effectiveDate}</TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{entry.employeeNumber}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.caseNumber}</TableCell>
                        <TableCell>{entry.caseType}</TableCell>
                        <TableCell>
                          <Badge variant={
                            getStatusCode(entry.status) === "LWD" ? "destructive" :
                            getStatusCode(entry.status) === "RWD" ? "outline" :
                            getStatusCode(entry.status) === "FD" ? "secondary" : "default"
                          }>
                            {getStatusCode(entry.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.caseStatus === "Open" ? "default" : entry.caseStatus === "Closed" ? "secondary" : "outline"}>
                            {entry.caseStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasError && <AlertTriangle className="h-4 w-4 text-red-500 inline" />}
                          {!hasError && hasWarning && <Info className="h-4 w-4 text-amber-500 inline" />}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {displayEntries.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing {displayEntries.length} entries
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

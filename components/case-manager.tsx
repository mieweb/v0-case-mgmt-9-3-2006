"use client"

import type React from "react"
import { getCaseTypeDescription } from "@/lib/case-type-utils"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CaseTab } from "@/components/tabs/case-tab"
import { ContactTab } from "@/components/tabs/contact-tab"
import { AbsenceRestrictionsTab } from "@/components/tabs/absence-restrictions-tab"
import { DiagnosisTab } from "@/components/tabs/diagnosis-tab"
import { TodosTab } from "@/components/tabs/todos-tab"
import { CaseNotesTab } from "@/components/tabs/case-notes-tab"
import { LettersTab } from "@/components/tabs/letters-tab"
import { DocumentsTab } from "@/components/tabs/documents-tab"
import { ActivityTab } from "@/components/tabs/activity-tab"
import { useCases, type CaseNote } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { ChevronDown, Pin, Plus, AlertCircle, Calendar, ShieldAlert, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NoteWindow, MinimizedNoteWindow } from "@/components/note-window"
import { RichTextEditor } from "@/components/rich-text-editor"

const TAB_ORDER = ["case", "contact", "absence-restrictions", "diagnosis", "todos", "case-notes", "letters", "documents", "activity"]

const TAB_LABELS: Record<string, string> = {
  "case": "Case",
  "contact": "Contacts", 
  "absence-restrictions": "Absences & Restrictions",
  "diagnosis": "Diagnosis",
  "todos": "To Do",
  "case-notes": "Case Notes",
  "letters": "Letters",
  "documents": "Documents",
  "activity": "Activity"
}

function TabNavigation({ 
  currentTab, 
  onTabChange 
}: { 
  currentTab: string
  onTabChange: (tab: string) => void 
}) {
  const currentIndex = TAB_ORDER.indexOf(currentTab)
  const prevTab = currentIndex > 0 ? TAB_ORDER[currentIndex - 1] : null
  const nextTab = currentIndex < TAB_ORDER.length - 1 ? TAB_ORDER[currentIndex + 1] : null

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t">
      <div>
        {prevTab && (
          <Button variant="outline" size="sm" onClick={() => onTabChange(prevTab)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {TAB_LABELS[prevTab]}
          </Button>
        )}
      </div>
      
      <Button variant="ghost" size="sm" onClick={scrollToTop}>
        <ArrowUp className="h-4 w-4 mr-1" />
        Back to Top
      </Button>
      
      <div>
        {nextTab && (
          <Button variant="outline" size="sm" onClick={() => onTabChange(nextTab)}>
            {TAB_LABELS[nextTab]}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function CaseManager() {
  const [activeTab, setActiveTab] = useState("case")
  const { currentCase, updateCase, getRestrictionsForEmployee } = useCases()
  const { codes } = useAdmin()
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false)
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)

  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false)
  const [isQuickNoteMinimized, setIsQuickNoteMinimized] = useState(false)
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split("T")[0])
  const [activity, setActivity] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [validationError, setValidationError] = useState<string>("")

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const shouldShowDetails = isHeaderExpanded || isHeaderHovered

  // Get active restrictions for this employee
  const activeRestrictions = currentCase 
    ? getRestrictionsForEmployee(currentCase.employeeNumber).filter(r => r.isActive)
    : []

  // Get current absence status (most recent entry)
  const currentAbsence = currentCase?.absences?.length 
    ? [...currentCase.absences].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0]
    : null

  // Helper to get status label
  const getAbsenceStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "FD": "Full Duty",
      "LWD": "Lost Work Days",
      "RWD": "Restricted Work Days",
      "RWDREGULARJOB": "OSHA Full Duty",
      "OTH": "Other"
    }
    return statusMap[status] || status
  }

  // Helper to get restriction display name
  const getRestrictionDisplayName = (code: string) => {
    const found = codes.restrictionCodes.find((c) => c.code === code)
    return found?.description || code
  }

  const handleQuickAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNoteDate(new Date().toISOString().split("T")[0])
    setActivity("")
    setNoteContent("")
    setValidationError("")
    setIsQuickNoteOpen(true)
    setIsQuickNoteMinimized(false)
  }

  const handleSaveQuickNote = () => {
    if (!currentCase || !noteContent || !activity) {
      const missingFields = []
      if (!activity) missingFields.push("Activity")
      if (!noteContent) missingFields.push("Notes")

      setValidationError(
        `Please fill in the required field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}`,
      )
      return
    }

    const now = new Date().toISOString().split("T")[0]
    const newNote: CaseNote = {
      id: `note-${Date.now()}`,
      caseNumber: currentCase.caseNumber,
      noteDate,
      activity,
      caseManager: currentCase.caseManager,
      notes: noteContent,
      createdBy: currentCase.caseManager,
      dateEntered: now,
      lineout: false,
    }

    const updatedNotes = [...(currentCase.caseNotes || []), newNote]
    updateCase(currentCase.caseNumber, { caseNotes: updatedNotes })

    setValidationError("")
    setIsQuickNoteOpen(false)
  }

  const handleOpenNoteInNewWindow = () => {
    const newWindow = window.open("", "_blank", "width=900,height=700")
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Create Note</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              .form-group { margin-bottom: 15px; }
              label { display: block; margin-bottom: 5px; font-weight: 500; }
              input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
              textarea { min-height: 400px; font-family: inherit; }
            </style>
          </head>
          <body>
            <h2>Create Note</h2>
            <div class="form-group">
              <label>Note Date</label>
              <input type="date" value="${noteDate}" />
            </div>
            <div class="form-group">
              <label>Activity</label>
              <select>
                <option value="Phone Call">Phone Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Case Review">Case Review</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea>${noteContent}</textarea>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  return (
    <div className="case-manager-container min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-[1400px]">
        <div
          className="case-header phi-data pii-data bg-card rounded-lg shadow-sm border p-3 mb-4 cursor-pointer transition-all duration-200 hover:shadow-md"
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
        >
          <div className="case-summary flex flex-wrap items-center gap-3 mb-3 pb-3 border-b">
            <div className="employee-name-field pii-data flex-1 min-w-[180px]">
              <div className="text-xs text-muted-foreground mb-1">Employee</div>
              <div className="text-sm font-medium">{currentCase?.employeeName || "—"}</div>
            </div>

            <div className="case-number-field w-[130px]">
              <div className="text-xs text-muted-foreground mb-1">Case #</div>
              <div className="text-sm font-medium">{currentCase?.caseNumber || "—"}</div>
            </div>

            <div className="case-status-field w-[100px]">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className="text-sm font-medium capitalize">{currentCase?.status || "—"}</div>
            </div>

            <div className="case-type-field w-[160px]">
              <div className="text-xs text-muted-foreground mb-1">Case type</div>
              <div className="text-sm font-medium">
                {currentCase?.caseType ? getCaseTypeDescription(currentCase.caseType) : "—"}
              </div>
            </div>

            <div className="case-manager-field w-[140px]">
              <div className="text-xs text-muted-foreground mb-1">Case manager</div>
              <div className="text-sm font-medium">{currentCase?.caseManager || "Unassigned"}</div>
            </div>

            <Button size="sm" variant="outline" onClick={handleQuickAddNote} className="h-8 gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add Case Note
            </Button>

            <div className="expand-toggle flex items-center gap-2">
              {isHeaderExpanded && <Pin className="h-4 w-4 text-primary fill-primary" />}
              <div
                className={`flex items-center justify-center rounded-full p-1 transition-colors ${
                  isHeaderExpanded ? "bg-primary/10" : ""
                }`}
              >
                <ChevronDown
                  className={`h-5 w-5 transition-all duration-200 ${
                    isHeaderExpanded ? "text-primary rotate-180" : "text-muted-foreground"
                  } ${isHeaderHovered && !isHeaderExpanded ? "text-foreground" : ""}`}
                />
              </div>
            </div>
          </div>

          <div
            className={`employee-details phi-data pii-data grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3 text-xs transition-all duration-200 origin-top ${
              shouldShowDetails ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 h-0 overflow-hidden"
            }`}
          >
            <div className="employee-number-field pii-data">
              <div className="text-muted-foreground mb-0.5">Employee Number</div>
              <div className="font-medium">{currentCase?.employeeNumber || "—"}</div>
            </div>
            <div className="employee-class-field">
              <div className="text-muted-foreground mb-0.5">Employee Class</div>
              <div className="font-medium">{currentCase?.employeeClass || "—"}</div>
            </div>
            <div className="date-of-birth-field phi-data pii-data">
              <div className="text-muted-foreground mb-0.5">Date of Birth</div>
              <div className="font-medium">{formatDateDisplay(currentCase?.dateOfBirth)}</div>
            </div>
            <div className="age-field phi-data">
              <div className="text-muted-foreground mb-0.5">Age</div>
              <div className="font-medium">{currentCase?.age || "—"}</div>
            </div>
            <div className="gender-field phi-data">
              <div className="text-muted-foreground mb-0.5">Gender</div>
              <div className="font-medium">{currentCase?.gender || "—"}</div>
            </div>

            <div className="address-field pii-data col-span-2">
              <div className="text-muted-foreground mb-0.5">Address</div>
              <div className="font-medium">{currentCase?.address || "—"}</div>
            </div>
            <div className="location-field">
              <div className="text-muted-foreground mb-0.5">Location</div>
              <div className="font-medium">{currentCase?.employeeLocation || "—"}</div>
            </div>
            <div className="call-center-field">
              <div className="text-muted-foreground mb-0.5">Call Center</div>
              <div className="font-medium">{currentCase?.callCenter || "—"}</div>
            </div>
            <div className="employment-type-field">
              <div className="text-muted-foreground mb-0.5">Hourly/Salaried</div>
              <div className="font-medium">{currentCase?.employmentType || "—"}</div>
            </div>

            <div className="position-field">
              <div className="text-muted-foreground mb-0.5">Position</div>
              <div className="font-medium">{currentCase?.position || "—"}</div>
            </div>
            <div className="hire-date-field">
              <div className="text-muted-foreground mb-0.5">Original Hire Date</div>
              <div className="font-medium">{formatDateDisplay(currentCase?.originalHireDate)}</div>
            </div>
            <div className="entry-date-field">
              <div className="text-muted-foreground mb-0.5">Entry Date</div>
              <div className="font-medium">{formatDateDisplay(currentCase?.entryDate)}</div>
            </div>
            <div className="service-date-field">
              <div className="text-muted-foreground mb-0.5">Adjusted Service Date</div>
              <div className="font-medium">{formatDateDisplay(currentCase?.adjustedServiceDate)}</div>
            </div>
            <div className="termination-date-field">
              <div className="text-muted-foreground mb-0.5">Termination Date</div>
              <div className="font-medium">{formatDateDisplay(currentCase?.terminationDate)}</div>
            </div>

            <div className="cell-phone-field pii-data">
              <div className="text-muted-foreground mb-0.5">Cell Phone</div>
              <div className="font-medium">{currentCase?.cellPhone || "—"}</div>
            </div>
            <div className="home-phone-field pii-data">
              <div className="text-muted-foreground mb-0.5">Home Phone</div>
              <div className="font-medium">{currentCase?.homePhone || "—"}</div>
            </div>
            <div className="email-field pii-data col-span-2">
              <div className="text-muted-foreground mb-0.5">Personal Email</div>
              <div className="font-medium">{currentCase?.personalEmail || "—"}</div>
            </div>
            <div className="union-field">
              <div className="text-muted-foreground mb-0.5">Union Description</div>
              <div className="font-medium">{currentCase?.unionDescription || "—"}</div>
            </div>

            <div className="emergency-contact-field pii-data">
              <div className="text-muted-foreground mb-0.5">Emergency Contact</div>
              <div className="font-medium">{currentCase?.emergencyContact || "—"}</div>
            </div>
            <div className="emergency-relation-field">
              <div className="text-muted-foreground mb-0.5">Emergency Relation</div>
              <div className="font-medium">{currentCase?.emergencyRelation || "—"}</div>
            </div>
            <div className="emergency-phone-field pii-data">
              <div className="text-muted-foreground mb-0.5">Emergency Work Phone</div>
              <div className="font-medium">{currentCase?.emergencyWorkPhone || "—"}</div>
            </div>

            {/* Active Absence & Restrictions Section */}
            <div className="col-span-full border-t pt-3 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Absence Status */}
                <div className="absence-status-section">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="font-medium">Current Absence Status</span>
                  </div>
                  {currentAbsence ? (
                    <div className="bg-muted/50 rounded-md p-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          currentAbsence.status === "FD" ? "text-green-600" : 
                          currentAbsence.status === "LWD" ? "text-red-600" : 
                          "text-amber-600"
                        }`}>
                          {getAbsenceStatusLabel(currentAbsence.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Since {currentAbsence.effectiveDate}
                        </span>
                      </div>
                      {currentAbsence.reason && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Reason: {currentAbsence.reason}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No absence records</div>
                  )}
                </div>

                {/* Active Restrictions */}
                <div className="restrictions-section">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span className="font-medium">Active Restrictions ({activeRestrictions.length})</span>
                  </div>
                  {activeRestrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeRestrictions.slice(0, 5).map((r) => (
                        <div 
                          key={r.id} 
                          className="inline-flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md"
                          title={`${r.startDate}${r.endDate ? ` - ${r.endDate}` : r.isPermanent ? ' (Permanent)' : ''}`}
                        >
                          {getRestrictionDisplayName(r.restriction)}
                          {r.isPermanent && <span className="ml-1 text-amber-600">(P)</span>}
                        </div>
                      ))}
                      {activeRestrictions.length > 5 && (
                        <div className="inline-flex items-center bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md">
                          +{activeRestrictions.length - 5} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No active restrictions</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="case-tabs w-full">
          <div className="sticky top-14 sm:top-16 z-40 bg-background shadow-sm">
            <TabsList className="case-tabs-list w-full justify-start bg-background border-b rounded-none h-auto p-0 flex-wrap">
            <TabsTrigger
              value="case"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Case
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="absence-restrictions"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
Absences & Restrictions
            </TabsTrigger>
            <TabsTrigger
              value="diagnosis"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Diagnosis
            </TabsTrigger>
            <TabsTrigger
              value="todos"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              To Do
            </TabsTrigger>
            <TabsTrigger
              value="case-notes"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Case Notes
            </TabsTrigger>
            <TabsTrigger
              value="letters"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Letters
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-t-lg rounded-b-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 font-medium"
            >
              Activity
            </TabsTrigger>
          </TabsList>
          </div>

          <div className="case-tabs-content bg-card rounded-lg rounded-tl-none shadow-sm border mt-0 p-6">
            <TabsContent value="case" className="m-0">
              <CaseTab />
              <TabNavigation currentTab="case" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="contact" className="m-0">
              <ContactTab />
              <TabNavigation currentTab="contact" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="absence-restrictions" className="m-0">
              <AbsenceRestrictionsTab />
              <TabNavigation currentTab="absence-restrictions" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="diagnosis" className="m-0">
              <DiagnosisTab />
              <TabNavigation currentTab="diagnosis" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="todos" className="m-0">
              <TodosTab />
              <TabNavigation currentTab="todos" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="case-notes" className="m-0">
              <CaseNotesTab />
              <TabNavigation currentTab="case-notes" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="letters" className="m-0">
              <LettersTab />
              <TabNavigation currentTab="letters" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="documents" className="m-0">
              <DocumentsTab />
              <TabNavigation currentTab="documents" onTabChange={setActiveTab} />
            </TabsContent>
            <TabsContent value="activity" className="m-0">
              <ActivityTab />
              <TabNavigation currentTab="activity" onTabChange={setActiveTab} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <NoteWindow
        isOpen={isQuickNoteOpen}
        isMinimized={isQuickNoteMinimized}
        onClose={() => setIsQuickNoteOpen(false)}
        onMinimize={() => setIsQuickNoteMinimized(true)}
        onRestore={() => setIsQuickNoteMinimized(false)}
        onOpenInNewWindow={handleOpenNoteInNewWindow}
        title="Create Note"
        onCancel={() => setIsQuickNoteOpen(false)}
        onSaveNote={handleSaveQuickNote}
      >
        <div className="note-form space-y-4 p-6">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quick-note-date" className="text-xs">
                Note Date
              </Label>
              <Input
                id="quick-note-date"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="bg-background h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quick-activity" className="text-xs">
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
                  id="quick-activity"
                  className={`bg-background h-8 text-sm ${!activity && validationError ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select activity..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Case Review">Case Review</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Case Manager</Label>
              <div className="bg-muted/50 rounded-md px-3 py-1.5 text-sm h-8 flex items-center">
                {currentCase?.caseManager || "Auto-assigned"}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Notes <span className="text-destructive">*</span>
            </Label>
            <RichTextEditor
              value={noteContent}
              onChange={(value) => {
                setNoteContent(value)
                if (validationError) setValidationError("")
              }}
              placeholder="Type your case notes here..."
              className="phi-data"
            />
          </div>
        </div>
      </NoteWindow>

      {isQuickNoteMinimized && (
        <div className="fixed bottom-4 left-4 z-40">
          <MinimizedNoteWindow
            title="Create Note"
            onRestore={() => setIsQuickNoteMinimized(false)}
            onClose={() => {
              setIsQuickNoteMinimized(false)
              setIsQuickNoteOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

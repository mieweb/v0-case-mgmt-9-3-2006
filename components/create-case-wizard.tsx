"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Check, AlertTriangle, FileText } from "lucide-react"
import { EmployeeAutocomplete } from "@/components/employee-autocomplete"
import { useCases } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface CreateCaseWizardProps {
  onComplete: () => void
}

export function CreateCaseWizard({ onComplete }: CreateCaseWizardProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 4
  const { addCase, cases, setCurrentCase } = useCases()
  const { caseTypes, codes, caseManagers } = useAdmin()

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeNumber: "",
    employeeLocation: "",
    caseType: "",
    caseCategory: "",
    caseManager: "",
    initialNotes: "",
    dateOfDisability: "",
    initialContactDate: "",
    actualReturnDate: "",
    expectedReturnDate: "",
    stdPlan: "",
    stdStartDate: "",
    absenceNotes: "",
  })

  // Get open/active cases for the selected employee
  const openCasesForEmployee = useMemo(() => {
    if (!formData.employeeNumber && !formData.employeeName) return []
    return cases.filter(
      (c) => 
        (c.employeeNumber === formData.employeeNumber || c.employeeName === formData.employeeName) && 
        (c.status === "Open" || c.status === "Active")
    )
  }, [cases, formData.employeeNumber, formData.employeeName])

  const handleOpenExistingCase = (caseNumber: string) => {
    const existingCase = cases.find((c) => c.caseNumber === caseNumber)
    if (existingCase) {
      setCurrentCase(existingCase)
      onComplete()
    }
  }

  const steps = [
    { number: 1, title: "Employee Information", description: "Select the employee for this case" },
    { number: 2, title: "Case Details", description: "Enter case type and basic information" },
    { number: 3, title: "Absence Information", description: "Add absence dates and details" },
    { number: 4, title: "Review & Create", description: "Review and confirm case creation" },
  ]

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      addCase({
        employeeName: formData.employeeName,
        employeeNumber: formData.employeeNumber,
        employeeLocation: formData.employeeLocation,
        caseType: formData.caseType,
        caseCategory: formData.caseCategory,
        caseManager: formData.caseManager || "Unassigned",
        status: "Open",
        dateOfDisability: formData.dateOfDisability,
        initialContactDate: formData.initialContactDate,
        actualReturnDate: formData.actualReturnDate,
        expectedReturnDate: formData.expectedReturnDate,
        stdPlan: formData.stdPlan,
        stdStartDate: formData.stdStartDate,
      })
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="wizard-container container mx-auto p-6 max-w-[900px]">
      <div className="wizard-header mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Case</h1>
        <p className="text-muted-foreground">Follow the steps to create a new employee case</p>
      </div>

      {/* Progress Steps */}
      <div className="wizard-progress bg-card rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                    step > s.number
                      ? "bg-primary text-primary-foreground"
                      : step === s.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? <Check className="h-5 w-5" /> : s.number}
                </div>
                <p
                  className={`text-sm font-medium text-center ${
                    step >= s.number ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1 hidden md:block">{s.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${step > s.number ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-content pii-data bg-card rounded-lg shadow-sm border p-6 min-h-[400px]">
        {step === 1 && (
          <div className="wizard-step-employee space-y-6">
            <h2 className="text-xl font-semibold">Employee Information</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-search">Employee Name or Employee Number</Label>
                <EmployeeAutocomplete
                  placeholder="Start typing to search..."
                  onSelect={(employee) => {
                    setFormData((prev) => ({
                      ...prev,
                      employeeName: employee.name,
                      employeeNumber: employee.number,
                      employeeLocation: employee.location,
                    }))
                  }}
                />
                <p className="text-xs text-muted-foreground">Search by name, employee number, or ID</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-number">Employee Number</Label>
                <Input
                  id="employee-number"
                  value={formData.employeeNumber}
                  placeholder="Auto-populated from HRIS"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.employeeLocation}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, employeeLocation: val }))}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Toledo, OH">Toledo, OH</SelectItem>
                    <SelectItem value="Newark, OH">Newark, OH</SelectItem>
                    <SelectItem value="Granville, OH">Granville, OH</SelectItem>
                    <SelectItem value="Kansas City, KS">Kansas City, KS</SelectItem>
                    <SelectItem value="Fort Worth, TX">Fort Worth, TX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show open/active cases for selected employee */}
              {(formData.employeeNumber || formData.employeeName) && openCasesForEmployee.length > 0 && (
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-200">Open Cases Found</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    <p className="mb-3">
                      This employee has {openCasesForEmployee.length} open/active case{openCasesForEmployee.length !== 1 ? "s" : ""}. 
                      If this is related to an existing injury or absence, please continue documenting on the existing case instead of creating a new one.
                    </p>
                    <div className="space-y-2">
                      {openCasesForEmployee.map((c) => (
                        <div
                          key={c.caseNumber}
                          className="flex items-center justify-between p-3 bg-background rounded-md border"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">{c.caseNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {c.caseType} - Opened {c.dateOpened}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={c.status === "Open" ? "default" : "secondary"}>{c.status}</Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenExistingCase(c.caseNumber)}
                            >
                              Open Case
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm">
                      If this is a <strong>new injury or absence</strong>, continue to create a new case.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step-case-details space-y-6">
            <h2 className="text-xl font-semibold">Case Details</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="case-type">Case Type</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, caseType: val }))}
                >
                  <SelectTrigger id="case-type">
                    <SelectValue placeholder="Select case type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.name}>
                        {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-category">Case Category</Label>
                <Select
                  value={formData.caseCategory}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, caseCategory: val }))}
                >
                  <SelectTrigger id="case-category">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {codes.caseCategory
                      .filter((cat) => cat.active)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.code}>
                          {cat.description || cat.code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-manager">Assign Case Manager</Label>
                <Select
                  value={formData.caseManager}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, caseManager: val }))}
                >
                  <SelectTrigger id="case-manager">
                    <SelectValue placeholder="Select case manager..." />
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

              <div className="space-y-2">
                <Label htmlFor="initial-notes">Initial Notes</Label>
                <Textarea
                  id="initial-notes"
                  placeholder="Enter any initial case notes..."
                  value={formData.initialNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, initialNotes: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step-absence space-y-6">
            <h2 className="text-xl font-semibold">Absence Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disability-date">Date of Disability</Label>
                  <Input
                    id="disability-date"
                    type="date"
                    value={formData.dateOfDisability}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfDisability: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial-contact">Initial Contact Date</Label>
                  <Input
                    id="initial-contact"
                    type="date"
                    value={formData.initialContactDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initialContactDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actual-return">Actual Return Date</Label>
                  <Input
                    id="actual-return"
                    type="date"
                    value={formData.actualReturnDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actualReturnDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected-return">Expected Return Date</Label>
                  <Input
                    id="expected-return"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="std-plan">STD Plan</Label>
                <Input
                  id="std-plan"
                  placeholder="Enter plan name or code"
                  value={formData.stdPlan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stdPlan: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="std-start">STD Start Date</Label>
                <Input
                  id="std-start"
                  type="date"
                  value={formData.stdStartDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stdStartDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="absence-notes">Absence Notes</Label>
                <Textarea
                  id="absence-notes"
                  placeholder="Additional absence information..."
                  value={formData.absenceNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, absenceNotes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step-review space-y-6">
            <h2 className="text-xl font-semibold">Review & Create</h2>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Employee Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span> {formData.employeeName || "[Not selected]"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Employee #:</span>{" "}
                    {formData.employeeNumber || "[Not selected]"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {formData.employeeLocation || "[Not selected]"}
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Case Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Case Type:</span> {formData.caseType || "[Not selected]"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Category:</span> {formData.caseCategory || "[Not selected]"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Case Manager:</span> {formData.caseManager || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Absence Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Date of Disability:</span>{" "}
                    {formData.dateOfDisability || "[Not entered]"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Expected Return:</span>{" "}
                    {formData.expectedReturnDate || "[Not entered]"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">STD Plan:</span> {formData.stdPlan || "[Not entered]"}
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
                <p className="text-sm">
                  Please review all information above. Click "Create Case" to finalize the case creation. A case number
                  will be automatically generated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="wizard-navigation flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === 1} className="gap-2 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {step === totalSteps ? (
              <>
                Create Case
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

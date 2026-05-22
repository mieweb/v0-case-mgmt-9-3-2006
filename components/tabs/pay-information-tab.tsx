"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Plus, Trash2, DollarSign, Briefcase, Shield, Calendar } from 'lucide-react'
import { useCases, JobAssignment, CompensationRate, getCurrentJob, getCurrentPay } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"

export function PayInformationTab() {
  const { currentCase, updateCase } = useCases()
  const { locations, getSTDCoverageForLocation } = useAdmin()

  // Current job and pay (derived from history)
  const currentJob = currentCase ? getCurrentJob(currentCase) : undefined
  const currentPay = currentCase ? getCurrentPay(currentCase) : undefined

  // Dialog states
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [editingPayId, setEditingPayId] = useState<string | null>(null)

  // STD Coverage lookup
  const [stdLookupDate, setStdLookupDate] = useState("")
  const [stdCoverage, setStdCoverage] = useState<{ plan: { planCode: string; planName: string; benefitPercentage: number; waitingPeriod: number; maxDuration: number }; rule: { effectiveDate: string } } | undefined>(undefined)

  // Job form state
  const [jobForm, setJobForm] = useState({
    effectiveDate: "",
    endDate: "",
    jobTitle: "",
    jobCode: "",
    locationId: "",
    locationName: "",
    managerName: ""
  })

  // Pay form state
  const [payForm, setPayForm] = useState({
    effectiveDate: "",
    endDate: "",
    rateAmount: "",
    unit: "hourly" as "hourly" | "weekly" | "monthly" | "annual",
    payCode: ""
  })

  // Initialize STD lookup date from date of disability
  useEffect(() => {
    if (currentCase?.dateOfDisability && !stdLookupDate) {
      setStdLookupDate(currentCase.dateOfDisability)
    }
  }, [currentCase?.dateOfDisability, stdLookupDate])

  // Lookup STD coverage when date changes
  useEffect(() => {
    if (stdLookupDate && currentJob) {
      const coverage = getSTDCoverageForLocation(currentJob.locationName, stdLookupDate)
      setStdCoverage(coverage)
    } else if (stdLookupDate && currentCase?.employeeLocation) {
      const coverage = getSTDCoverageForLocation(currentCase.employeeLocation, stdLookupDate)
      setStdCoverage(coverage)
    } else {
      setStdCoverage(undefined)
    }
  }, [stdLookupDate, currentJob, currentCase?.employeeLocation, getSTDCoverageForLocation])

  // Calculate FICA date (date of disability + 6 months + first day of next month)
  const calculateFicaDate = (): string => {
    if (!currentCase?.dateOfDisability) return "—"
    
    // Parse MM/DD/YYYY
    const [month, day, year] = currentCase.dateOfDisability.split('/')
    const disabilityDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (isNaN(disabilityDate.getTime())) return "—"

    const sixMonthsLater = new Date(disabilityDate)
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

    const nextMonth = new Date(sixMonthsLater)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)

    return `${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${String(nextMonth.getDate()).padStart(2, '0')}/${nextMonth.getFullYear()}`
  }

  // Format currency
  const formatCurrency = (amount: number, unit: string): string => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    const unitLabel = unit === "hourly" ? "/hr" : unit === "weekly" ? "/wk" : unit === "monthly" ? "/mo" : "/yr"
    return `${formatted}${unitLabel}`
  }

  // Reset job form
  const resetJobForm = () => {
    setJobForm({
      effectiveDate: "",
      endDate: "",
      jobTitle: "",
      jobCode: "",
      locationId: "",
      locationName: "",
      managerName: ""
    })
    setEditingJobId(null)
  }

  // Reset pay form
  const resetPayForm = () => {
    setPayForm({
      effectiveDate: "",
      endDate: "",
      rateAmount: "",
      unit: "hourly",
      payCode: ""
    })
    setEditingPayId(null)
  }

  // Handle job dialog open for add
  const handleAddJob = () => {
    resetJobForm()
    setShowJobDialog(true)
  }

  // Handle job dialog open for edit
  const handleEditJob = (job: JobAssignment) => {
    setJobForm({
      effectiveDate: job.effectiveDate,
      endDate: job.endDate || "",
      jobTitle: job.jobTitle,
      jobCode: job.jobCode || "",
      locationId: job.locationId,
      locationName: job.locationName,
      managerName: job.managerName || ""
    })
    setEditingJobId(job.id)
    setShowJobDialog(true)
  }

  // Save job
  const handleSaveJob = () => {
    if (!currentCase || !jobForm.effectiveDate || !jobForm.jobTitle || !jobForm.locationName) return

    const jobHistory = currentCase.jobHistory || []
    
    if (editingJobId) {
      // Update existing
      const updated = jobHistory.map(job => 
        job.id === editingJobId 
          ? { ...job, ...jobForm, endDate: jobForm.endDate || undefined }
          : job
      )
      updateCase(currentCase.caseNumber, { jobHistory: updated })
    } else {
      // Add new
      const newJob: JobAssignment = {
        id: `job-${Date.now()}`,
        effectiveDate: jobForm.effectiveDate,
        endDate: jobForm.endDate || undefined,
        jobTitle: jobForm.jobTitle,
        jobCode: jobForm.jobCode || undefined,
        locationId: jobForm.locationId || `loc-${jobForm.locationName.toLowerCase().replace(/\s/g, '-')}`,
        locationName: jobForm.locationName,
        managerName: jobForm.managerName || undefined
      }
      updateCase(currentCase.caseNumber, { jobHistory: [...jobHistory, newJob] })
    }

    setShowJobDialog(false)
    resetJobForm()
  }

  // Delete job
  const handleDeleteJob = (id: string) => {
    if (!currentCase) return
    const updated = (currentCase.jobHistory || []).filter(job => job.id !== id)
    updateCase(currentCase.caseNumber, { jobHistory: updated })
  }

  // Handle pay dialog open for add
  const handleAddPay = () => {
    resetPayForm()
    setShowPayDialog(true)
  }

  // Handle pay dialog open for edit
  const handleEditPay = (pay: CompensationRate) => {
    setPayForm({
      effectiveDate: pay.effectiveDate,
      endDate: pay.endDate || "",
      rateAmount: pay.rateAmount.toString(),
      unit: pay.unit,
      payCode: pay.payCode || ""
    })
    setEditingPayId(pay.id)
    setShowPayDialog(true)
  }

  // Save pay
  const handleSavePay = () => {
    if (!currentCase || !payForm.effectiveDate || !payForm.rateAmount) return

    const compensationHistory = currentCase.compensationHistory || []
    
    if (editingPayId) {
      // Update existing
      const updated = compensationHistory.map(pay => 
        pay.id === editingPayId 
          ? { ...pay, ...payForm, rateAmount: parseFloat(payForm.rateAmount), endDate: payForm.endDate || undefined }
          : pay
      )
      updateCase(currentCase.caseNumber, { compensationHistory: updated })
    } else {
      // Add new
      const newPay: CompensationRate = {
        id: `pay-${Date.now()}`,
        effectiveDate: payForm.effectiveDate,
        endDate: payForm.endDate || undefined,
        rateAmount: parseFloat(payForm.rateAmount),
        currency: "USD",
        unit: payForm.unit,
        payCode: payForm.payCode || undefined
      }
      updateCase(currentCase.caseNumber, { compensationHistory: [...compensationHistory, newPay] })
    }

    setShowPayDialog(false)
    resetPayForm()
  }

  // Delete pay
  const handleDeletePay = (id: string) => {
    if (!currentCase) return
    const updated = (currentCase.compensationHistory || []).filter(pay => pay.id !== id)
    updateCase(currentCase.caseNumber, { compensationHistory: updated })
  }

  // Sort history by effective date descending
  const sortedJobHistory = [...(currentCase?.jobHistory || [])].sort((a, b) => {
    const dateA = new Date(a.effectiveDate.split('/').reverse().join('-'))
    const dateB = new Date(b.effectiveDate.split('/').reverse().join('-'))
    return dateB.getTime() - dateA.getTime()
  })

  const sortedPayHistory = [...(currentCase?.compensationHistory || [])].sort((a, b) => {
    const dateA = new Date(a.effectiveDate.split('/').reverse().join('-'))
    const dateB = new Date(b.effectiveDate.split('/').reverse().join('-'))
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="space-y-6">
      {/* Current Position & Compensation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Position Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Current Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentJob ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Job Title</p>
                  <p className="font-medium">{currentJob.jobTitle}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{currentJob.locationName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Manager</p>
                  <p className="font-medium">{currentJob.managerName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Effective Date</p>
                  <p className="font-medium">{currentJob.effectiveDate}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No job assignment found. Add one below.</p>
            )}
          </CardContent>
        </Card>

        {/* Current Compensation Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Current Compensation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPay ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Rate</p>
                  <p className="font-medium text-lg">{formatCurrency(currentPay.rateAmount, currentPay.unit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Effective Date</p>
                  <p className="font-medium">{currentPay.effectiveDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pay Code</p>
                  <p className="font-medium">{currentPay.payCode || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">FICA Date</p>
                  <p className="font-medium">{calculateFicaDate()}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No compensation found. Add one below.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Job Assignment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Assignment History
            </CardTitle>
            <CardDescription>Track job title, location, and manager changes over time</CardDescription>
          </div>
          <Button onClick={handleAddJob} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {sortedJobHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No job history entries. Click &quot;Add Entry&quot; to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedJobHistory.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.effectiveDate}</TableCell>
                    <TableCell>{job.endDate || "—"}</TableCell>
                    <TableCell className="font-medium">{job.jobTitle}</TableCell>
                    <TableCell>{job.locationName}</TableCell>
                    <TableCell>{job.managerName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteJob(job.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pay Rate History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pay Rate History
            </CardTitle>
            <CardDescription>Track compensation changes with effective dates</CardDescription>
          </div>
          <Button onClick={handleAddPay} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {sortedPayHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pay history entries. Click &quot;Add Entry&quot; to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Pay Code</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayHistory.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell>{pay.effectiveDate}</TableCell>
                    <TableCell>{pay.endDate || "—"}</TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pay.rateAmount)}
                    </TableCell>
                    <TableCell className="capitalize">{pay.unit}</TableCell>
                    <TableCell>{pay.payCode || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditPay(pay)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePay(pay.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* STD Coverage Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            STD Coverage Lookup
          </CardTitle>
          <CardDescription>View eligible STD plan based on employee location at a given date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>As-of Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={stdLookupDate}
                  onChange={(e) => setStdLookupDate(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Defaults to Date of Disability
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Location: <span className="font-medium text-foreground">{currentJob?.locationName || currentCase?.employeeLocation || "Unknown"}</span>
            </div>
          </div>

          {stdCoverage ? (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-3">Eligible STD Coverage</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Code</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Benefit %</TableHead>
                    <TableHead>Waiting Period</TableHead>
                    <TableHead>Max Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">{stdCoverage.plan.planCode}</TableCell>
                    <TableCell>{stdCoverage.plan.planName}</TableCell>
                    <TableCell>{stdCoverage.plan.benefitPercentage}%</TableCell>
                    <TableCell>{stdCoverage.plan.waitingPeriod} days</TableCell>
                    <TableCell>{stdCoverage.plan.maxDuration} weeks</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : stdLookupDate ? (
            <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
              <p className="text-sm">No STD coverage found for this location and date combination.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Job Assignment Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJobId ? "Edit Job Assignment" : "Add Job Assignment"}</DialogTitle>
            <DialogDescription>Enter job assignment details with effective dates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date *</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={jobForm.effectiveDate}
                  onChange={(e) => setJobForm({ ...jobForm, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={jobForm.endDate}
                  onChange={(e) => setJobForm({ ...jobForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  value={jobForm.jobTitle}
                  onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Job Code</Label>
                <Input
                  value={jobForm.jobCode}
                  onChange={(e) => setJobForm({ ...jobForm, jobCode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select
                  value={jobForm.locationName}
                  onValueChange={(val) => {
                    const loc = locations.find(l => l.name === val)
                    setJobForm({ ...jobForm, locationName: val, locationId: loc?.id || "" })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.filter(l => l.active).map((loc) => (
                      <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Manager</Label>
                <Input
                  value={jobForm.managerName}
                  onChange={(e) => setJobForm({ ...jobForm, managerName: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJobDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveJob} disabled={!jobForm.effectiveDate || !jobForm.jobTitle || !jobForm.locationName}>
              {editingJobId ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Rate Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayId ? "Edit Pay Rate" : "Add Pay Rate"}</DialogTitle>
            <DialogDescription>Enter compensation details with effective dates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date *</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={payForm.effectiveDate}
                  onChange={(e) => setPayForm({ ...payForm, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={payForm.endDate}
                  onChange={(e) => setPayForm({ ...payForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-7"
                    value={payForm.rateAmount}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = value.split('.')
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('')
                      } else if (parts[1]?.length > 2) {
                        value = parts[0] + '.' + parts[1].slice(0, 2)
                      }
                      setPayForm({ ...payForm, rateAmount: value })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select
                  value={payForm.unit}
                  onValueChange={(val: "hourly" | "weekly" | "monthly" | "annual") => setPayForm({ ...payForm, unit: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pay Code</Label>
              <Input
                placeholder="e.g., SAL-EXEMPT, HRL-NONEX"
                value={payForm.payCode}
                onChange={(e) => setPayForm({ ...payForm, payCode: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePay} disabled={!payForm.effectiveDate || !payForm.rateAmount}>
              {editingPayId ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

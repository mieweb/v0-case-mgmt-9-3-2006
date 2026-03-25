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
import { useCases, type TodoItem, type Restriction } from "@/contexts/cases-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAdmin } from "@/contexts/admin-context"
import { useEmployees } from "@/contexts/employees-context"
import { generateTodosFromTemplates } from "@/lib/todo-parser"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const adjusterData: Record<string, { name: string; phone: string; email: string }> = {
  ALLENA: { name: "Ashley Allen", phone: "763-416-8905", email: "ashley_allen@gbtpa.com" },
  ANDERSONR: { name: "Randolph Anderson", phone: "303-218-7865", email: "randolph_anderson@gbtpa.com" },
  BADALI: { name: "Derek Badali", phone: "", email: "derek_badali@gbtpa.com" },
  BENTLEY: { name: "Shuntrea Bentley", phone: "954-378-2895", email: "shuntrea_bentley@gbtpa.com" },
  BLUM: { name: "Michael Blum", phone: "303-218-7848", email: "michael_blum1@gbtpa.com" },
  CAHILL: { name: "Erin Cahill", phone: "502-423-4300", email: "erin_cahill@gbtpa.com" },
  CHINND: { name: "Donna Chinn", phone: "916-893-4016", email: "donna_chinn1@gbtpa.com" },
  CONNORD: { name: "Danielle Connor", phone: "315-741-3884", email: "danielle_connor@gbtpa.com" },
  COPELANDC: { name: "Christie Copeland", phone: "303-218-7830", email: "christie_copeland@gbtpa.com" },
  CRAWFORDT: { name: "Thellene Crawford", phone: "303-218-7876", email: "thellene_crawford@gbtpa.com" },
  CRUZT: { name: "Toni Cruz", phone: "503-303-6318", email: "toni_cruz@gbtpa.com" },
  DROUARET: { name: "Tyler Drouare", phone: "517-318-8109", email: "tyer_drouare@gbtpa.com" },
  FOXC: { name: "Carol Fox", phone: "781-519-7792", email: "carol_fox@gbtpa.com" },
  GASTONC: { name: "Cristal Gaston", phone: "972-728-1149", email: "cristal_gaston@gbtpa.com" },
  GROTANS: { name: "Sandi Grotans", phone: "816-942-8555", email: "sandi_grotans@gbtpa.com" },
  HANDLEY: { name: "Deanna Handley", phone: "501-392-3074", email: "deanna_handley@gbtpa.com" },
  JONESSANDY: { name: "Sandy Jones", phone: "763-416-8904", email: "sandy_jones@gbtpa.com" },
  JONEST: { name: "Tellie Jones", phone: "954-378-5319", email: "tellie_jones@gbtpa.com" },
  MALONE: { name: "Shemaya Malone", phone: "704-405-6694", email: "shemaya_malone@gbtpa.com" },
  MCDONALDA: { name: "Alexsis McDonald", phone: "972-728-3584", email: "alexsis_mcdonald@gbtpa.com" },
  MCQUADE: { name: "Jennifer McQuade", phone: "614-356-2272", email: "Jennifer_McQuade@gbtpa.com" },
  MELENDEZ: { name: "Tracy Melendez", phone: "916-576-4499", email: "tracy_melendez@gbtpa.com" },
  MORGANS: { name: "Susan Morgan", phone: "315-484-5837", email: "susan_morgan@gbtpa.com" },
  MURPHY: { name: "Melanie Murphy", phone: "856-780-3053", email: "melanie_murphy@gbtpa.com" },
  NABORSS: { name: "Stephanie Nabors", phone: "501-392-3052", email: "stephanie_nabors@gbtpa.com" },
  NEWTONM: { name: "Michelle Newton", phone: "972-728-1121", email: "michelle_newton@gbtpa.com" },
  NORRIS: { name: "Andrew Norris", phone: "303-218-7812", email: "andrew_norris@gbtpa.com" },
  OSBORNEL: { name: "Leslie Osborne", phone: "502-963-0386", email: "leslie_osborne@gbtpa.com" },
  OTERO: { name: "Jessie Otero", phone: "405-529-5073", email: "jessie_otero@gbtpa.com" },
  PIKEB: { name: "Brittany Pike", phone: "502-963-0394", email: "brittany_pike@gbtpa.com" },
  PRESLEYK: { name: "Karen Presley", phone: "847-273-0439", email: "karen_presley@gbtpa.com" },
  PROVENCHER: { name: "Karen Provencher", phone: "781-519-7788", email: "karen_provencher@gbtpa.com" },
  RAINSA: { name: "April Rains", phone: "503-675-6575", email: "april_rains@gbtpa.com" },
  SANCHEZJ: { name: "Jessica Sanchez", phone: "847-273-0395", email: "Jessica_Sanchez@gbtpa.com" },
  SPANGLERB: { name: "Beth Spangler", phone: "704-405-6734", email: "beth_spangler@gbtpa.com" },
  SPEAKER: { name: "Katrina Sepaker", phone: "856-780-3050", email: "katrina_speaker@gbtpa.com" },
  TAYLORH: { name: "Heather Taylor", phone: "614-356-2352", email: "Heather_Taylor@gbtpa.com" },
  TURK: { name: "Maureen Turk", phone: "502-963-0378", email: "maureen_turk@gbtpa.com" },
  VELEZM: { name: "Mayra Velez", phone: "954-378-2916", email: "mayra_velez@gbtpa.com" },
  WADOODA: { name: "Aneesa Wadood", phone: "951-893-4013", email: "aneesa_wadood@gbtpa.com" },
  WATSONA: { name: "Amy Watson", phone: "972-728-1098", email: "amy_watson1@gbtpa.com" },
  WATSONL: { name: "Lisa Watson", phone: "614-356-2263", email: "lisa_watson@gbtpa.com" },
  WHIPPLEV: { name: "Victoria Whipple", phone: "574-344-2920", email: "victoria_whipple@gbtpa.com" },
  WROBLAKH: { name: "Holly Wroblak", phone: "517-318-8105", email: "holly_wroblak@gbtpa.com" },
}

export function CaseTab() {
  const { currentCase, updateCase, restrictions, updateRestriction } = useCases()
  const { caseTypes, codes, getCaseType, caseManagers } = useAdmin()
  const { employees } = useEmployees()

  const [status, setStatus] = useState("")
  const [caseType, setCaseType] = useState("")
  const [caseManager, setCaseManager] = useState(currentCase?.caseManager || "Unassigned")
  const [dateOfDisability, setDateOfDisability] = useState("")
  const [initialContactDate, setInitialContactDate] = useState("")
  const [dateClosed, setDateClosed] = useState("")
  const [closureReason, setClosureReason] = useState("")
  const [expectedConfinementDate, setExpectedConfinementDate] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [stdPlan, setStdPlan] = useState("")
  const [stdStartDate, setStdStartDate] = useState("")
  const [adjuster, setAdjuster] = useState("")
  const [ddgDays, setDdgDays] = useState("")
  const [ddgReturnDate, setDdgReturnDate] = useState("")
  const [hcpContacted, setHcpContacted] = useState(false)
  const [expectedReturnDate, setExpectedReturnDate] = useState("")
  const [actualReturnDate, setActualReturnDate] = useState("")
  const [payStartDate, setPayStartDate] = useState("")
  const [payEndDate, setPayEndDate] = useState("")
  const [ficaDate, setFicaDate] = useState("")
  const [ddgDaysError, setDdgDaysError] = useState("")
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
  
  // Occupational Injury Information
  const [siteCaseNumber, setSiteCaseNumber] = useState("")
  const [injuryDate, setInjuryDate] = useState("")
  const [injuryTime, setInjuryTime] = useState("")
  const [injuryLocation, setInjuryLocation] = useState("")
  const [incidentOnsiteOffsite, setIncidentOnsiteOffsite] = useState("")
  const [locationAddress, setLocationAddress] = useState("")
  const [locationCity, setLocationCity] = useState("")
  const [locationState, setLocationState] = useState("")
  const [locationZip, setLocationZip] = useState("")
  const [locationCountry, setLocationCountry] = useState("")
  const [locationDescription, setLocationDescription] = useState("")
  const [workstation, setWorkstation] = useState("")
  const [injuryShift, setInjuryShift] = useState("")
  const [shiftStartTime, setShiftStartTime] = useState("")
  const [injurySupervisor, setInjurySupervisor] = useState("")
  const [supervisorNotifiedDate, setSupervisorNotifiedDate] = useState("")
  const [isCaseWorkRelated, setIsCaseWorkRelated] = useState("")
  const [typeOfInjuryOrIllness, setTypeOfInjuryOrIllness] = useState("")
  const [significantInjuryIllness, setSignificantInjuryIllness] = useState("")
  const [injuryDescription, setInjuryDescription] = useState("")
  const [bodyPartAffected, setBodyPartAffected] = useState("")
  const [injuryNature, setInjuryNature] = useState("")
  const [injuryCause, setInjuryCause] = useState("")
  const [oshaRecordable, setOshaRecordable] = useState(false)
  const [oshaClassification, setOshaClassification] = useState("")
  const [recordabilityRationale, setRecordabilityRationale] = useState("")
  const [psmIncident, setPsmIncident] = useState("")
  const [sharpsCase, setSharpsCase] = useState("")
  const [caseExtent, setCaseExtent] = useState("")
  const [workersCompClaim, setWorkersCompClaim] = useState("")
  const [workersCompClaimNumber, setWorkersCompClaimNumber] = useState("")
  const [claimStatusResolution, setClaimStatusResolution] = useState("")

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
      setExpectedConfinementDate(currentCase.expectedConfinementDate || "")
      setDeliveryDate(currentCase.deliveryDate || "")
      setStdPlan(currentCase.stdPlan || "")
      setStdStartDate(currentCase.stdStartDate || "")
      setAdjuster(currentCase.adjuster || "")
      setDdgDays(currentCase.ddgDays || "")
      setDdgReturnDate(currentCase.ddgReturnDate || "")
      setHcpContacted(currentCase.hcpContacted || false)
      setExpectedReturnDate(currentCase.expectedReturnDate || "")
      setActualReturnDate(currentCase.actualReturnDate || "")
      setPayStartDate(currentCase.payStartDate || "")
      setPayEndDate(currentCase.payEndDate || "")
      setFicaDate(currentCase.ficaDate || "")
      // Occupational Injury Information
      setSiteCaseNumber(currentCase.siteCaseNumber || "")
      setInjuryDate(currentCase.injuryDate || "")
      setInjuryTime(currentCase.injuryTime || "")
      setInjuryLocation(currentCase.injuryLocation || "")
      setIncidentOnsiteOffsite(currentCase.incidentOnsiteOffsite || "")
      setLocationAddress(currentCase.locationAddress || "")
      setLocationCity(currentCase.locationCity || "")
      setLocationState(currentCase.locationState || "")
      setLocationZip(currentCase.locationZip || "")
      setLocationCountry(currentCase.locationCountry || "")
      setLocationDescription(currentCase.locationDescription || "")
      setWorkstation(currentCase.workstation || "")
      setInjuryShift(currentCase.injuryShift || "")
      setShiftStartTime(currentCase.shiftStartTime || "")
      setInjurySupervisor(currentCase.injurySupervisor || "")
      setSupervisorNotifiedDate(currentCase.supervisorNotifiedDate || "")
      setIsCaseWorkRelated(currentCase.isCaseWorkRelated || "")
      setTypeOfInjuryOrIllness(currentCase.typeOfInjuryOrIllness || "")
      setSignificantInjuryIllness(currentCase.significantInjuryIllness || "")
      setInjuryDescription(currentCase.injuryDescription || "")
      setBodyPartAffected(currentCase.bodyPartAffected || "")
      setInjuryNature(currentCase.injuryNature || "")
      setInjuryCause(currentCase.injuryCause || "")
      setOshaRecordable(currentCase.oshaRecordable || false)
      setOshaClassification(currentCase.oshaClassification || "")
      setRecordabilityRationale(currentCase.recordabilityRationale || "")
      setPsmIncident(currentCase.psmIncident || "")
      setSharpsCase(currentCase.sharpsCase || "")
      setCaseExtent(currentCase.caseExtent || "")
      setWorkersCompClaim(currentCase.workersCompClaim || "")
      setWorkersCompClaimNumber(currentCase.workersCompClaimNumber || "")
      setClaimStatusResolution(currentCase.claimStatusResolution || "")
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
      dateScheduled: pt.dueDate.toISOString().split("T")[0],
      activity: pt.title,
      caseManager: currentCase.caseManager || "",
      completed: false,
    }))

    updateCase(
      currentCase.caseNumber,
      { todos: newTodos },
      {
        action: "added",
        field: "todos",
        newValue: `${newTodos.length} items`,
        description: `Auto-generated ${newTodos.length} todos from ${caseTypeObj.name} template based on disability date`,
      },
    )
  }

  const handleConfidentialChange = (checked: boolean) => {
    if (checked && !isConfidential) {
      setShowConfidentialWarning(true)
    } else {
      setIsConfidential(checked)
      handleFieldUpdate("confidential", checked)
    }
  }

  const confirmConfidential = () => {
    setIsConfidential(true)
    handleFieldUpdate("confidential", true)
    setShowConfidentialWarning(false)
  }

  useEffect(() => {
    if (!currentCase || !dateOfDisability) {
      if (ficaDate !== "") {
        setFicaDate("")
        updateCase(currentCase.caseNumber, { ficaDate: "" })
      }
      return
    }

    const disabilityDate = new Date(dateOfDisability)
    if (isNaN(disabilityDate.getTime())) {
      if (ficaDate !== "") {
        setFicaDate("")
        updateCase(currentCase.caseNumber, { ficaDate: "" })
      }
      return
    }

    const sixMonthsLater = new Date(disabilityDate)
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

    const nextMonth = new Date(sixMonthsLater)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)

    const formattedFicaDate = nextMonth.toISOString().split("T")[0]

    if (ficaDate !== formattedFicaDate) {
      setFicaDate(formattedFicaDate)
      updateCase(currentCase.caseNumber, { ficaDate: formattedFicaDate })
    }
  }, [dateOfDisability])

  useEffect(() => {
    if (!currentCase) return

    setDdgDaysError("")

    if (!stdStartDate || !ddgDays) {
      const newReturnDate = ""
      if (ddgReturnDate !== newReturnDate) {
        setDdgReturnDate(newReturnDate)
        updateCase(currentCase.caseNumber, {
          ddgReturnDate: newReturnDate,
          stdStartDate,
          ddgDays,
        })
      }
      return
    }

    const daysNum = Number.parseInt(ddgDays, 10)
    if (isNaN(daysNum) || daysNum < 0 || ddgDays !== daysNum.toString()) {
      setDdgDaysError("DDG Days must be a non-negative integer")
      const newReturnDate = ""
      if (ddgReturnDate !== newReturnDate) {
        setDdgReturnDate(newReturnDate)
        updateCase(currentCase.caseNumber, {
          ddgReturnDate: newReturnDate,
          stdStartDate,
          ddgDays,
        })
      }
      return
    }

    const startDate = new Date(stdStartDate)
    if (isNaN(startDate.getTime())) {
      const newReturnDate = ""
      if (ddgReturnDate !== newReturnDate) {
        setDdgReturnDate(newReturnDate)
        updateCase(currentCase.caseNumber, {
          ddgReturnDate: newReturnDate,
          stdStartDate,
          ddgDays,
        })
      }
      return
    }

    const returnDate = new Date(startDate)
    returnDate.setDate(returnDate.getDate() + daysNum)

    const formattedDate = returnDate.toISOString().split("T")[0]

    if (ddgReturnDate !== formattedDate) {
      setDdgReturnDate(formattedDate)
      updateCase(currentCase.caseNumber, {
        ddgReturnDate: formattedDate,
        stdStartDate,
        ddgDays,
      })
    }
  }, [stdStartDate, ddgDays])

  const caseManagerEmployees = employees.filter(
    (emp) => emp.active && (emp.role === "case-manager" || emp.role === "admin"),
  )

  if (!currentCase) {
    return <div className="case-tab-no-data p-6 text-center text-muted-foreground">No case selected</div>
  }

  return (
    <div className="case-tab-container phi-data space-y-6">
      <div className="case-info-section space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Case Information</h3>
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
                  .filter((s) => s.active && s.code !== "Closed")
                  .map((statusCode) => (
                    <SelectItem key={statusCode.id} value={statusCode.code}>
                      {statusCode.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-end">
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

        <div className="flex items-center space-x-2 pt-2">
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
      </div>

      <div className="case-dates-section space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Case Dates</h3>
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
      </div>

      <div className="maternity-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Maternity Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expected-confinement" className="text-sm text-muted-foreground">
              Expected Date of Confinement
            </Label>
            <Input
              id="expected-confinement"
              type="date"
              className="bg-background"
              value={expectedConfinementDate}
              onChange={(e) => {
                setExpectedConfinementDate(e.target.value)
                handleFieldUpdate("expectedConfinementDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-date" className="text-sm text-muted-foreground">
              Actual delivery date
            </Label>
            <Input
              id="delivery-date"
              type="date"
              className="bg-background"
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value)
                handleFieldUpdate("deliveryDate", e.target.value)
              }}
            />
          </div>
        </div>
      </div>

      <div className="std-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Short-Term Disability (STD)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="std-plan" className="text-sm text-muted-foreground">
              STD plan
            </Label>
            <Input
              id="std-plan"
              placeholder="Plan name or code"
              className="bg-background"
              value={stdPlan}
              onChange={(e) => {
                setStdPlan(e.target.value)
                handleFieldUpdate("stdPlan", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="std-start" className="text-sm text-muted-foreground">
              STD start date
            </Label>
            <Input
              id="std-start"
              type="date"
              className="bg-background"
              value={stdStartDate}
              onChange={(e) => {
                setStdStartDate(e.target.value)
                handleFieldUpdate("stdStartDate", e.target.value)
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adjuster" className="text-sm text-muted-foreground">
            Adjuster (GB adjuster)
          </Label>
          <Select
            value={adjuster}
            onValueChange={(val) => {
              setAdjuster(val)
              const adjInfo = adjusterData[val]
              if (adjInfo) {
                handleFieldUpdate("adjuster", val)
                handleFieldUpdate("adjusterPhone", adjInfo.phone)
                handleFieldUpdate("adjusterEmail", adjInfo.email)
              } else {
                handleFieldUpdate("adjuster", val)
              }
            }}
          >
            <SelectTrigger id="adjuster" className="bg-background w-full md:w-1/2">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALLENA">Ashley Allen</SelectItem>
              <SelectItem value="ANDERSONR">Randolph Anderson</SelectItem>
              <SelectItem value="BADALI">Derek Badali</SelectItem>
              <SelectItem value="BENTLEY">Shuntrea Bentley</SelectItem>
              <SelectItem value="BLUM">Michael Blum</SelectItem>
              <SelectItem value="CAHILL">Erin Cahill</SelectItem>
              <SelectItem value="CHINND">Donna Chinn</SelectItem>
              <SelectItem value="CONNORD">Danielle Connor</SelectItem>
              <SelectItem value="COPELANDC">Christie Copeland</SelectItem>
              <SelectItem value="CRAWFORDT">Thellene Crawford</SelectItem>
              <SelectItem value="CRUZT">Toni Cruz</SelectItem>
              <SelectItem value="DROUARET">Tyler Drouare</SelectItem>
              <SelectItem value="FOXC">Carol Fox</SelectItem>
              <SelectItem value="GASTONC">Cristal Gaston</SelectItem>
              <SelectItem value="GROTANS">Sandi Grotans</SelectItem>
              <SelectItem value="HANDLEY">Deanna Handley</SelectItem>
              <SelectItem value="JONESSANDY">Sandy Jones</SelectItem>
              <SelectItem value="JONEST">Tellie Jones</SelectItem>
              <SelectItem value="MALONE">Shemaya Malone</SelectItem>
              <SelectItem value="MCDONALDA">Alexsis McDonald</SelectItem>
              <SelectItem value="MCQUADE">Jennifer McQuade</SelectItem>
              <SelectItem value="MELENDEZ">Tracy Melendez</SelectItem>
              <SelectItem value="MORGANS">Susan Morgan</SelectItem>
              <SelectItem value="MURPHY">Melanie Murphy</SelectItem>
              <SelectItem value="NABORSS">Stephanie Nabors</SelectItem>
              <SelectItem value="NEWTONM">Michelle Newton</SelectItem>
              <SelectItem value="NORRIS">Andrew Norris</SelectItem>
              <SelectItem value="OSBORNEL">Leslie Osborne</SelectItem>
              <SelectItem value="OTERO">Jessie Otero</SelectItem>
              <SelectItem value="PIKEB">Brittany Pike</SelectItem>
              <SelectItem value="PRESLEYK">Karen Presley</SelectItem>
              <SelectItem value="PROVENCHER">Karen Provencher</SelectItem>
              <SelectItem value="RAINSA">April Rains</SelectItem>
              <SelectItem value="SANCHEZJ">Jessica Sanchez</SelectItem>
              <SelectItem value="SPANGLERB">Beth Spangler</SelectItem>
              <SelectItem value="SPEAKER">Katrina Sepaker</SelectItem>
              <SelectItem value="TAYLORH">Heather Taylor</SelectItem>
              <SelectItem value="TURK">Maureen Turk</SelectItem>
              <SelectItem value="VELEZM">Mayra Velez</SelectItem>
              <SelectItem value="WADOODA">Aneesa Wadood</SelectItem>
              <SelectItem value="WATSONA">Amy Watson</SelectItem>
              <SelectItem value="WATSONL">Lisa Watson</SelectItem>
              <SelectItem value="WHIPPLEV">Victoria Whipple</SelectItem>
              <SelectItem value="WROBLAKH">Holly Wroblak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adjuster-phone" className="text-sm text-muted-foreground">
            Adjuster Phone
          </Label>
          <Input
            id="adjuster-phone"
            type="tel"
            className="bg-background"
            value={currentCase?.adjusterPhone || ""}
            onChange={(e) => handleFieldUpdate("adjusterPhone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adjuster-email" className="text-sm text-muted-foreground">
            Adjuster Email
          </Label>
          <Input
            id="adjuster-email"
            type="email"
            className="bg-background"
            value={currentCase?.adjusterEmail || ""}
            onChange={(e) => handleFieldUpdate("adjusterEmail", e.target.value)}
            placeholder="adjuster@example.com"
          />
        </div>
      </div>

      <div className="ddg-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Duration of Disability Guidelines (DDG)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ddg-days" className="text-sm text-muted-foreground">
              DDG days
            </Label>
            <Input
              id="ddg-days"
              type="number"
              min="0"
              step="1"
              className="bg-background"
              value={ddgDays}
              onChange={(e) => {
                setDdgDays(e.target.value)
                handleFieldUpdate("ddgDays", e.target.value)
              }}
            />
            {ddgDaysError && <p className="text-xs text-destructive mt-1">{ddgDaysError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ddg-return" className="text-sm text-muted-foreground">
              DDG return date <span className="text-xs italic">(auto-calculated)</span>
            </Label>
            <Input id="ddg-return" type="date" className="bg-muted/50" value={ddgReturnDate} readOnly />
            {!stdStartDate && ddgDays && (
              <Alert variant="default" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">Enter Start Date to calculate DDG Return Date.</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">HCP contacted within 7 days?</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="hcp-contacted"
                checked={hcpContacted}
                onCheckedChange={(checked) => {
                  setHcpContacted(checked as boolean)
                  handleFieldUpdate("hcpContacted", checked)
                }}
              />
              <label
                htmlFor="hcp-contacted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Yes (prior to DDG expiring)
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="return-to-work-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Return to Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expected-return" className="text-sm text-muted-foreground">
              Expected return date
            </Label>
            <Input
              id="expected-return"
              type="date"
              className="bg-background"
              value={expectedReturnDate}
              onChange={(e) => {
                setExpectedReturnDate(e.target.value)
                handleFieldUpdate("expectedReturnDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual-return" className="text-sm text-muted-foreground">
              Actual return date
            </Label>
            <Input
              id="actual-return"
              type="date"
              className="bg-background"
              value={actualReturnDate}
              onChange={(e) => {
                setActualReturnDate(e.target.value)
                handleFieldUpdate("actualReturnDate", e.target.value)
              }}
            />
          </div>
        </div>
      </div>

      <div className="work-status-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Work Status Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="days-lost" className="text-sm text-muted-foreground">
              Days lost <span className="text-xs italic">(calculated)</span>
            </Label>
            <Input id="days-lost" className="bg-muted/50" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days-restricted" className="text-sm text-muted-foreground">
              Days restricted <span className="text-xs italic">(calculated)</span>
            </Label>
            <Input id="days-restricted" className="bg-muted/50" readOnly />
          </div>
        </div>
      </div>

      <div className="pay-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Pay Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pay-start" className="text-sm text-muted-foreground">
              Pay start date
            </Label>
            <Input
              id="pay-start"
              type="date"
              className="bg-background"
              value={payStartDate}
              onChange={(e) => {
                setPayStartDate(e.target.value)
                handleFieldUpdate("payStartDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-end" className="text-sm text-muted-foreground">
              Pay end date
            </Label>
            <Input
              id="pay-end"
              type="date"
              className="bg-background"
              value={payEndDate}
              onChange={(e) => {
                setPayEndDate(e.target.value)
                handleFieldUpdate("payEndDate", e.target.value)
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fica-date" className="text-sm text-muted-foreground">
              FICA tracking date <span className="text-xs italic">(auto-calculated)</span>
            </Label>
            <Input id="fica-date" type="date" className="bg-muted/50" value={ficaDate} readOnly />
            <p className="text-xs text-muted-foreground mt-1">
              Date of disability + 6 months + first day of next month
            </p>
          </div>
        </div>
      </div>

      <div className="occupational-injury-section phi-data space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Occupational Injury Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site-case-number" className="text-sm text-muted-foreground">
              Site Case #
            </Label>
            <Input
              id="site-case-number"
              placeholder="Enter site case number"
              className="bg-background"
              value={siteCaseNumber}
              onChange={(e) => {
                setSiteCaseNumber(e.target.value)
                handleFieldUpdate("siteCaseNumber", e.target.value)
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="injury-date" className="text-sm text-muted-foreground">
              Date of injury
            </Label>
            <Input
              id="injury-date"
              type="date"
              className="bg-background"
              value={injuryDate}
              onChange={(e) => {
                setInjuryDate(e.target.value)
                handleFieldUpdate("injuryDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="injury-time" className="text-sm text-muted-foreground">
              Time of injury
            </Label>
            <Input
              id="injury-time"
              type="time"
              className="bg-background"
              value={injuryTime}
              onChange={(e) => {
                setInjuryTime(e.target.value)
                handleFieldUpdate("injuryTime", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="injury-location" className="text-sm text-muted-foreground">
              Location of injury
            </Label>
            <Input
              id="injury-location"
              placeholder="e.g., Warehouse, Office, Job Site"
              className="bg-background"
              value={injuryLocation}
              onChange={(e) => {
                setInjuryLocation(e.target.value)
                handleFieldUpdate("injuryLocation", e.target.value)
              }}
            />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-foreground border-b pb-2 mt-4">Location Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="incident-onsite-offsite" className="text-sm text-muted-foreground">
              Where the incident happened
            </Label>
            <Select
              value={incidentOnsiteOffsite}
              onValueChange={(val) => {
                setIncidentOnsiteOffsite(val)
                handleFieldUpdate("incidentOnsiteOffsite", val)
              }}
            >
              <SelectTrigger id="incident-onsite-offsite" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Offsite">Offsite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workstation" className="text-sm text-muted-foreground">
              Workstation
            </Label>
            <Input
              id="workstation"
              placeholder="Enter workstation"
              className="bg-background"
              value={workstation}
              onChange={(e) => {
                setWorkstation(e.target.value)
                handleFieldUpdate("workstation", e.target.value)
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-address" className="text-sm text-muted-foreground">
              Address
            </Label>
            <Input
              id="location-address"
              placeholder="Street address"
              className="bg-background"
              value={locationAddress}
              onChange={(e) => {
                setLocationAddress(e.target.value)
                handleFieldUpdate("locationAddress", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-city" className="text-sm text-muted-foreground">
              City
            </Label>
            <Input
              id="location-city"
              placeholder="City"
              className="bg-background"
              value={locationCity}
              onChange={(e) => {
                setLocationCity(e.target.value)
                handleFieldUpdate("locationCity", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-state" className="text-sm text-muted-foreground">
              State
            </Label>
            <Input
              id="location-state"
              placeholder="State"
              className="bg-background"
              value={locationState}
              onChange={(e) => {
                setLocationState(e.target.value)
                handleFieldUpdate("locationState", e.target.value)
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location-zip" className="text-sm text-muted-foreground">
              Zip Code
            </Label>
            <Input
              id="location-zip"
              placeholder="Zip"
              className="bg-background"
              value={locationZip}
              onChange={(e) => {
                setLocationZip(e.target.value)
                handleFieldUpdate("locationZip", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-country" className="text-sm text-muted-foreground">
              Country
            </Label>
            <Input
              id="location-country"
              placeholder="Country"
              className="bg-background"
              value={locationCountry}
              onChange={(e) => {
                setLocationCountry(e.target.value)
                handleFieldUpdate("locationCountry", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-description" className="text-sm text-muted-foreground">
              Description of where the event occurred
            </Label>
            <Input
              id="location-description"
              placeholder="e.g., loading dock, north end"
              className="bg-background"
              value={locationDescription}
              onChange={(e) => {
                setLocationDescription(e.target.value)
                handleFieldUpdate("locationDescription", e.target.value)
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="injury-shift" className="text-sm text-muted-foreground">
              Shift
            </Label>
            <Select
              value={injuryShift}
              onValueChange={(val) => {
                setInjuryShift(val)
                handleFieldUpdate("injuryShift", val)
              }}
            >
              <SelectTrigger id="injury-shift" className="bg-background">
                <SelectValue placeholder="Select shift..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Shift">1st Shift</SelectItem>
                <SelectItem value="2nd Shift">2nd Shift</SelectItem>
                <SelectItem value="3rd Shift">3rd Shift</SelectItem>
                <SelectItem value="Day Shift">Day Shift</SelectItem>
                <SelectItem value="Night Shift">Night Shift</SelectItem>
                <SelectItem value="Rotating">Rotating</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift-start-time" className="text-sm text-muted-foreground">
              Shift Start Time
            </Label>
            <Input
              id="shift-start-time"
              type="time"
              className="bg-background"
              value={shiftStartTime}
              onChange={(e) => {
                setShiftStartTime(e.target.value)
                handleFieldUpdate("shiftStartTime", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="injury-supervisor" className="text-sm text-muted-foreground">
              Supervisor
            </Label>
            <Input
              id="injury-supervisor"
              placeholder="Supervisor name"
              className="bg-background"
              value={injurySupervisor}
              onChange={(e) => {
                setInjurySupervisor(e.target.value)
                handleFieldUpdate("injurySupervisor", e.target.value)
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supervisor-notified-date" className="text-sm text-muted-foreground">
              When was the supervisor notified?
            </Label>
            <Input
              id="supervisor-notified-date"
              type="datetime-local"
              className="bg-background"
              value={supervisorNotifiedDate}
              onChange={(e) => {
                setSupervisorNotifiedDate(e.target.value)
                handleFieldUpdate("supervisorNotifiedDate", e.target.value)
              }}
            />
          </div>
        </div>
        
        <h4 className="text-sm font-semibold text-foreground border-b pb-2 mt-4">Work Related Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="is-case-work-related" className="text-sm text-muted-foreground">
              Is the case work related?
            </Label>
            <Select
              value={isCaseWorkRelated}
              onValueChange={(val) => {
                setIsCaseWorkRelated(val)
                handleFieldUpdate("isCaseWorkRelated", val)
              }}
            >
              <SelectTrigger id="is-case-work-related" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Under Investigation">Under Investigation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type-of-injury-illness" className="text-sm text-muted-foreground">
              Type of injury or illness
            </Label>
            <Select
              value={typeOfInjuryOrIllness}
              onValueChange={(val) => {
                setTypeOfInjuryOrIllness(val)
                handleFieldUpdate("typeOfInjuryOrIllness", val)
              }}
            >
              <SelectTrigger id="type-of-injury-illness" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Injury">Injury</SelectItem>
                <SelectItem value="Illness">Illness</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="significant-injury-illness" className="text-sm text-muted-foreground">
              Significant injury/illness
            </Label>
            <Select
              value={significantInjuryIllness}
              onValueChange={(val) => {
                setSignificantInjuryIllness(val)
                handleFieldUpdate("significantInjuryIllness", val)
              }}
            >
              <SelectTrigger id="significant-injury-illness" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wc-claim" className="text-sm text-muted-foreground">
              Workers&apos; Comp claim filed?
            </Label>
            <Select
              value={workersCompClaim}
              onValueChange={(val) => {
                setWorkersCompClaim(val)
                handleFieldUpdate("workersCompClaim", val)
              }}
            >
              <SelectTrigger id="wc-claim" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {workersCompClaim === "Yes" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="wc-claim-number" className="text-sm text-muted-foreground">
                  Workers&apos; Comp claim number
                </Label>
                <Input
                  id="wc-claim-number"
                  placeholder="Claim number"
                  className="bg-background"
                  value={workersCompClaimNumber}
                  onChange={(e) => {
                    setWorkersCompClaimNumber(e.target.value)
                    handleFieldUpdate("workersCompClaimNumber", e.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-status-resolution" className="text-sm text-muted-foreground">
                  Claim status and resolution
                </Label>
                <Select
                  value={claimStatusResolution}
                  onValueChange={(val) => {
                    setClaimStatusResolution(val)
                    handleFieldUpdate("claimStatusResolution", val)
                  }}
                >
                  <SelectTrigger id="claim-status-resolution" className="bg-background">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                    <SelectItem value="Settled">Settled</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">OSHA recordable?</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="osha-recordable"
                checked={oshaRecordable}
                onCheckedChange={(checked) => {
                  setOshaRecordable(checked as boolean)
                  handleFieldUpdate("oshaRecordable", checked)
                }}
              />
              <label
                htmlFor="osha-recordable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Yes, this is an OSHA recordable injury
              </label>
            </div>
          </div>
          {oshaRecordable && (
            <div className="space-y-2">
              <Label htmlFor="osha-classification" className="text-sm text-muted-foreground">
                OSHA classification
              </Label>
              <Select
                value={oshaClassification}
                onValueChange={(val) => {
                  setOshaClassification(val)
                  handleFieldUpdate("oshaClassification", val)
                }}
              >
                <SelectTrigger id="osha-classification" className="bg-background">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Death">Death</SelectItem>
                  <SelectItem value="Days Away From Work">Days Away From Work</SelectItem>
                  <SelectItem value="Job Transfer/Restriction">Job Transfer/Restriction</SelectItem>
                  <SelectItem value="Other Recordable">Other Recordable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {oshaRecordable && (
            <div className="space-y-2">
              <Label htmlFor="recordability-rationale" className="text-sm text-muted-foreground">
                Recordability Rationale
              </Label>
              <Input
                id="recordability-rationale"
                placeholder="Enter rationale..."
                className="bg-background"
                value={recordabilityRationale}
                onChange={(e) => {
                  setRecordabilityRationale(e.target.value)
                  handleFieldUpdate("recordabilityRationale", e.target.value)
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="psm-incident" className="text-sm text-muted-foreground">
              PSM Incident
            </Label>
            <Select
              value={psmIncident}
              onValueChange={(val) => {
                setPsmIncident(val)
                handleFieldUpdate("psmIncident", val)
              }}
            >
              <SelectTrigger id="psm-incident" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sharps-case" className="text-sm text-muted-foreground">
              Sharps Case
            </Label>
            <Select
              value={sharpsCase}
              onValueChange={(val) => {
                setSharpsCase(val)
                handleFieldUpdate("sharpsCase", val)
              }}
            >
              <SelectTrigger id="sharps-case" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-extent" className="text-sm text-muted-foreground">
              Case Extent
            </Label>
            <Select
              value={caseExtent}
              onValueChange={(val) => {
                setCaseExtent(val)
                handleFieldUpdate("caseExtent", val)
              }}
            >
              <SelectTrigger id="case-extent" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Minor">Minor</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Severe">Severe</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="injury-description" className="text-sm text-muted-foreground">
            Description of injury/illness
          </Label>
          <textarea
            id="injury-description"
            placeholder="Describe how the injury occurred..."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={injuryDescription}
            onChange={(e) => {
              setInjuryDescription(e.target.value)
              handleFieldUpdate("injuryDescription", e.target.value)
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="body-part" className="text-sm text-muted-foreground">
              Body part affected
            </Label>
            <Input
              id="body-part"
              placeholder="e.g., Lower back, Right hand"
              className="bg-background"
              value={bodyPartAffected}
              onChange={(e) => {
                setBodyPartAffected(e.target.value)
                handleFieldUpdate("bodyPartAffected", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="injury-nature" className="text-sm text-muted-foreground">
              Nature of injury
            </Label>
            <Select
              value={injuryNature}
              onValueChange={(val) => {
                setInjuryNature(val)
                handleFieldUpdate("injuryNature", val)
              }}
            >
              <SelectTrigger id="injury-nature" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sprain/Strain">Sprain/Strain</SelectItem>
                <SelectItem value="Fracture">Fracture</SelectItem>
                <SelectItem value="Cut/Laceration">Cut/Laceration</SelectItem>
                <SelectItem value="Contusion/Bruise">Contusion/Bruise</SelectItem>
                <SelectItem value="Burn">Burn</SelectItem>
                <SelectItem value="Amputation">Amputation</SelectItem>
                <SelectItem value="Carpal Tunnel">Carpal Tunnel</SelectItem>
                <SelectItem value="Hernia">Hernia</SelectItem>
                <SelectItem value="Hearing Loss">Hearing Loss</SelectItem>
                <SelectItem value="Respiratory">Respiratory</SelectItem>
                <SelectItem value="Dermatitis">Dermatitis</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="injury-cause" className="text-sm text-muted-foreground">
              Cause of injury
            </Label>
            <Select
              value={injuryCause}
              onValueChange={(val) => {
                setInjuryCause(val)
                handleFieldUpdate("injuryCause", val)
              }}
            >
              <SelectTrigger id="injury-cause" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Overexertion">Overexertion</SelectItem>
                <SelectItem value="Fall - Same Level">Fall - Same Level</SelectItem>
                <SelectItem value="Fall - Different Level">Fall - Different Level</SelectItem>
                <SelectItem value="Struck By Object">Struck By Object</SelectItem>
                <SelectItem value="Struck Against Object">Struck Against Object</SelectItem>
                <SelectItem value="Caught In/Between">Caught In/Between</SelectItem>
                <SelectItem value="Repetitive Motion">Repetitive Motion</SelectItem>
                <SelectItem value="Motor Vehicle">Motor Vehicle</SelectItem>
                <SelectItem value="Exposure - Chemical">Exposure - Chemical</SelectItem>
                <SelectItem value="Exposure - Temperature">Exposure - Temperature</SelectItem>
                <SelectItem value="Violence">Violence</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>

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

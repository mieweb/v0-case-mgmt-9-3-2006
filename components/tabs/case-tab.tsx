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
import { AlertCircle, Briefcase, MapPin, FileText, Stethoscope, Shield, Activity, Info, FolderOpen, Calendar, Clock, BarChart3, HardHat, DollarSign } from "lucide-react"
import { CollapsibleSection } from "@/components/ui/collapsible-section"

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
  const [caseType, setCaseType] = useState("Non-occupational injury / illness")
  const [caseSeverity, setCaseSeverity] = useState("")
  const [caseManager, setCaseManager] = useState(currentCase?.caseManager || "Unassigned")
  const [dateOfDisability, setDateOfDisability] = useState("")
  const [caseIncidentDate, setCaseIncidentDate] = useState("")
  const [caseIncidentTime, setCaseIncidentTime] = useState("")
  const [reportedDate, setReportedDate] = useState("")
  const [reportedTime, setReportedTime] = useState("")
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
  const [maximumMedicalImprovement, setMaximumMedicalImprovement] = useState("")
  const [permanentPartialImpairment, setPermanentPartialImpairment] = useState("")
  const [percentageImpaired, setPercentageImpaired] = useState("")
  const [payEndDate, setPayEndDate] = useState("")
  const [ficaDate, setFicaDate] = useState("")
  const [ddgDaysError, setDdgDaysError] = useState("")
  const [isConfidential, setIsConfidential] = useState(currentCase?.confidential || false)
  const [showConfidentialWarning, setShowConfidentialWarning] = useState(false)
  const [showCloseCaseDialog, setShowCloseCaseDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [selectedTodosToClose, setSelectedTodosToClose] = useState<string[]>([])
  const [selectedRestrictionsToClose, setSelectedRestrictionsToClose] = useState<string[]>([])
  // Close case dialog fields
  const [closeCaseDateClosed, setCloseCaseDateClosed] = useState(new Date().toISOString().split("T")[0])
  const [closeCaseClosureReason, setCloseCaseClosureReason] = useState("")
  const [closeCaseActualReturnDate, setCloseCaseActualReturnDate] = useState("")
  const [closeCaseStdEndDate, setCloseCaseStdEndDate] = useState("")
  const [closeCaseAbsenceUpdates, setCloseCaseAbsenceUpdates] = useState<Record<string, { status: string; otherStatus?: string }>>({})
  const [closeCaseRestrictionUpdates, setCloseCaseRestrictionUpdates] = useState<Record<string, { endDate?: string; isPermanent?: boolean }>>({})
  const [closeCaseOtherAbsenceStatus, setCloseCaseOtherAbsenceStatus] = useState("")
  
  // Get open items for current case
  const openTodos = currentCase?.todos?.filter((t) => !t.completed) || []
  const openRestrictions = restrictions.filter(
    (r) => r.caseNumber === currentCase?.caseNumber && r.isActive
  )
  // Get open absences - those without an end status (FD = Full Duty means closed)
  const openAbsences = currentCase?.absences?.filter((a) => a.statusType !== "FD") || []
  
  // Occupational Injury Information
  const [siteCaseNumber, setSiteCaseNumber] = useState("")
  const [injuryDate, setInjuryDate] = useState("")
  const [injuryTime, setInjuryTime] = useState("")
  const [injuryLocation, setInjuryLocation] = useState("")
  const [shiftHours, setShiftHours] = useState("")
  const [incidentOnsiteOffsite, setIncidentOnsiteOffsite] = useState("")
  const [locationAddress, setLocationAddress] = useState("")
  const [locationCity, setLocationCity] = useState("")
  const [locationState, setLocationState] = useState("")
  const [locationZip, setLocationZip] = useState("")
  const [locationCountry, setLocationCountry] = useState("")
  const [gpsCoordinates, setGpsCoordinates] = useState("")
  const [locationDescription, setLocationDescription] = useState("")
  const [workstation, setWorkstation] = useState("")
  const [employeeDoingBefore, setEmployeeDoingBefore] = useState("")
  const [howInjuryHappened, setHowInjuryHappened] = useState("")
  const [objectSubstanceCaused, setObjectSubstanceCaused] = useState("")
  const [accidentType, setAccidentType] = useState("")
  const [jsaReference, setJsaReference] = useState("")
  const [medicalTreatmentProvided, setMedicalTreatmentProvided] = useState("")
  const [treatmentDescription, setTreatmentDescription] = useState("")
  const [whereTreatmentProvided, setWhereTreatmentProvided] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [hospitalAddress, setHospitalAddress] = useState("")
  const [hospitalPhone, setHospitalPhone] = useState("")
  const [providerInformation, setProviderInformation] = useState("")
  const [treatedInEmergencyRoom, setTreatedInEmergencyRoom] = useState("")
  const [hospitalizedOvernight, setHospitalizedOvernight] = useState("")
  const [emergencyTransportationUsed, setEmergencyTransportationUsed] = useState("")
  const [firstAidTreatments, setFirstAidTreatments] = useState<string[]>([])
  const [treatmentsBeyondFirstAid, setTreatmentsBeyondFirstAid] = useState<string[]>([])
  const [caseTransferredTo3rdParty, setCaseTransferredTo3rdParty] = useState("")
  const [employeeRequestedTreatment, setEmployeeRequestedTreatment] = useState("")
  const [prescriptionsPhysicalTherapy, setPrescriptionsPhysicalTherapy] = useState("")
  const [injuryShift, setInjuryShift] = useState("")
  const [shiftStartTime, setShiftStartTime] = useState("")
  const [injurySupervisor, setInjurySupervisor] = useState("")
  const [supervisorNotifiedDate, setSupervisorNotifiedDate] = useState("")
  const [isCaseWorkRelated, setIsCaseWorkRelated] = useState("")
  const [employeeOccupation, setEmployeeOccupation] = useState("")
  const [contingentWork, setContingentWork] = useState("")
  const [typeOfInjuryOrIllness, setTypeOfInjuryOrIllness] = useState("")
  const [significantInjuryIllness, setSignificantInjuryIllness] = useState("")
  const [injuryDescription, setInjuryDescription] = useState("")
  const [whatEmployeeDoing, setWhatEmployeeDoing] = useState("")
  const [whatHappened, setWhatHappened] = useState("")
  const [whatObjectHarmed, setWhatObjectHarmed] = useState("")
  const [bodyPartAffected, setBodyPartAffected] = useState("")
  const [injuryNature, setInjuryNature] = useState("")
  const [injuryCause, setInjuryCause] = useState("")
  const [dateOfDeath, setDateOfDeath] = useState("")
  const [oshaRecordable, setOshaRecordable] = useState("")
  const [oshaClassification, setOshaClassification] = useState("")
  const [recordabilityRationale, setRecordabilityRationale] = useState("")
  const [psmIncident, setPsmIncident] = useState("")
  const [sharpsCase, setSharpsCase] = useState("")
  const [caseExtent, setCaseExtent] = useState("")
  const [workersCompClaim, setWorkersCompClaim] = useState("")
  const [workersCompClaimNumber, setWorkersCompClaimNumber] = useState("")
  const [claimStatusResolution, setClaimStatusResolution] = useState("")
  const [wcClaimNumber, setWcClaimNumber] = useState("")
  const [adjusterContact, setAdjusterContact] = useState("")
  const [investigationDetails, setInvestigationDetails] = useState("")
  const [seriousInjuryFatality, setSeriousInjuryFatality] = useState("")
  const [hsProgram, setHsProgram] = useState("")
  const [processCondition, setProcessCondition] = useState("")
  const [processDetails, setProcessDetails] = useState("")
  const [associatedIICases, setAssociatedIICases] = useState("")
  const [notifyCaseManagementTPA, setNotifyCaseManagementTPA] = useState("")
  const [recordOnly, setRecordOnly] = useState("")
  const [daysAway, setDaysAway] = useState("")
  const [daysRestricted, setDaysRestricted] = useState("")

  useEffect(() => {
    if (currentCase) {
      setStatus(currentCase.status || "Open")
      setCaseType(currentCase.caseType || "Non-occupational injury / illness")
      setCaseSeverity(currentCase.caseSeverity || "")
      setCaseManager(currentCase.caseManager || "Unassigned")
      setIsConfidential(currentCase.confidential || false)
      setDateOfDisability(currentCase.dateOfDisability || "")
      setCaseIncidentDate(currentCase.caseIncidentDate || "")
      setCaseIncidentTime(currentCase.caseIncidentTime || "")
      setReportedDate(currentCase.reportedDate || "")
      setReportedTime(currentCase.reportedTime || "")
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
      setMaximumMedicalImprovement(currentCase.maximumMedicalImprovement || "")
      setPermanentPartialImpairment(currentCase.permanentPartialImpairment || "")
      setPercentageImpaired(currentCase.percentageImpaired || "")
      setPayEndDate(currentCase.payEndDate || "")
      setFicaDate(currentCase.ficaDate || "")
      // Occupational Injury Information
      setSiteCaseNumber(currentCase.siteCaseNumber || "")
      setInjuryDate(currentCase.injuryDate || "")
      setInjuryTime(currentCase.injuryTime || "")
      setInjuryLocation(currentCase.injuryLocation || "")
      setShiftHours(currentCase.shiftHours || "")
      setIncidentOnsiteOffsite(currentCase.incidentOnsiteOffsite || "")
      setLocationAddress(currentCase.locationAddress || "")
      setLocationCity(currentCase.locationCity || "")
      setLocationState(currentCase.locationState || "")
      setLocationZip(currentCase.locationZip || "")
      setLocationCountry(currentCase.locationCountry || "")
      setGpsCoordinates(currentCase.gpsCoordinates || "")
      setLocationDescription(currentCase.locationDescription || "")
      setWorkstation(currentCase.workstation || "")
      setEmployeeDoingBefore(currentCase.employeeDoingBefore || "")
      setHowInjuryHappened(currentCase.howInjuryHappened || "")
      setObjectSubstanceCaused(currentCase.objectSubstanceCaused || "")
      setAccidentType(currentCase.accidentType || "")
      setJsaReference(currentCase.jsaReference || "")
      setMedicalTreatmentProvided(currentCase.medicalTreatmentProvided || "")
      setTreatmentDescription(currentCase.treatmentDescription || "")
      setWhereTreatmentProvided(currentCase.whereTreatmentProvided || "")
      setHospitalName(currentCase.hospitalName || "")
      setHospitalAddress(currentCase.hospitalAddress || "")
      setHospitalPhone(currentCase.hospitalPhone || "")
      setProviderInformation(currentCase.providerInformation || "")
      setTreatedInEmergencyRoom(currentCase.treatedInEmergencyRoom || "")
      setHospitalizedOvernight(currentCase.hospitalizedOvernight || "")
      setEmergencyTransportationUsed(currentCase.emergencyTransportationUsed || "")
      setFirstAidTreatments(currentCase.firstAidTreatments || [])
      setTreatmentsBeyondFirstAid(currentCase.treatmentsBeyondFirstAid || [])
      setCaseTransferredTo3rdParty(currentCase.caseTransferredTo3rdParty || "")
      setEmployeeRequestedTreatment(currentCase.employeeRequestedTreatment || "")
      setPrescriptionsPhysicalTherapy(currentCase.prescriptionsPhysicalTherapy || "")
      setInjuryShift(currentCase.injuryShift || "")
      setShiftStartTime(currentCase.shiftStartTime || "")
      setInjurySupervisor(currentCase.injurySupervisor || "")
      setSupervisorNotifiedDate(currentCase.supervisorNotifiedDate || "")
      setIsCaseWorkRelated(currentCase.isCaseWorkRelated || "")
      setEmployeeOccupation(currentCase.employeeOccupation || "")
      setContingentWork(currentCase.contingentWork || "")
      setTypeOfInjuryOrIllness(currentCase.typeOfInjuryOrIllness || "")
      setSignificantInjuryIllness(currentCase.significantInjuryIllness || "")
      setInjuryDescription(currentCase.injuryDescription || "")
      setWhatEmployeeDoing(currentCase.whatEmployeeDoing || "")
      setWhatHappened(currentCase.whatHappened || "")
      setWhatObjectHarmed(currentCase.whatObjectHarmed || "")
      setBodyPartAffected(currentCase.bodyPartAffected || "")
      setInjuryNature(currentCase.injuryNature || "")
      setInjuryCause(currentCase.injuryCause || "")
      setDateOfDeath(currentCase.dateOfDeath || "")
      setOshaRecordable(currentCase.oshaRecordable || "")
      setOshaClassification(currentCase.oshaClassification || "")
      setRecordabilityRationale(currentCase.recordabilityRationale || "")
      setPsmIncident(currentCase.psmIncident || "")
      setSharpsCase(currentCase.sharpsCase || "")
      setCaseExtent(currentCase.caseExtent || "")
      setWorkersCompClaim(currentCase.workersCompClaim || "")
      setWorkersCompClaimNumber(currentCase.workersCompClaimNumber || "")
      setClaimStatusResolution(currentCase.claimStatusResolution || "")
      setWcClaimNumber(currentCase.wcClaimNumber || "")
      setAdjusterContact(currentCase.adjusterContact || "")
      setInvestigationDetails(currentCase.investigationDetails || "")
      setSeriousInjuryFatality(currentCase.seriousInjuryFatality || "")
      setHsProgram(currentCase.hsProgram || "")
      setProcessCondition(currentCase.processCondition || "")
      setProcessDetails(currentCase.processDetails || "")
      setAssociatedIICases(currentCase.associatedIICases || "")
      setNotifyCaseManagementTPA(currentCase.notifyCaseManagementTPA || "")
      setRecordOnly(currentCase.recordOnly || "")
      setDaysAway(currentCase.daysAway || "")
      setDaysRestricted(currentCase.daysRestricted || "")
    }
  }, [currentCase])

  const handleFieldUpdate = (field: string, value: any) => {
    if (currentCase) {
      updateCase(currentCase.caseNumber, { [field]: value })
    }
  }

  // Helper functions to check if sections have data
  const hasOccupationalInjuryData = () => Boolean(siteCaseNumber || injuryDate || injuryTime || injuryLocation || injuryShift || shiftStartTime || injurySupervisor || supervisorNotifiedDate)
  const hasWorkRelatedData = () => Boolean(isCaseWorkRelated || typeOfInjuryOrIllness || significantInjuryIllness || workersCompClaim || oshaRecordable || psmIncident || sharpsCase || caseExtent)
  const hasLocationData = () => Boolean(incidentOnsiteOffsite || workstation || locationAddress || locationCity || locationState || locationZip || locationCountry || locationDescription)
  const hasIncidentDescriptionData = () => Boolean(siteCaseNumber || accidentType || jsaReference || objectSubstanceCaused || howInjuryHappened || employeeDoingBefore)
  const hasTreatmentData = () => Boolean(treatmentDescription || treatedInEmergencyRoom || hospitalizedOvernight || emergencyTransportationUsed)
  const hasWorkCompData = () => Boolean(currentCase?.workCompClaimNumber || currentCase?.workCompCarrier || currentCase?.workCompAdjuster || currentCase?.workCompPhone)
  const hasInjuryDetailsData = () => Boolean(injuryNature || injuryCause || bodyPartAffected || dateOfDeath || injuryDescription)

  const generateTodosFromDisabilityDate = (disabilityDate: string) => {
    if (!currentCase || !disabilityDate || !currentCase.caseType) return

    const caseTypeObj = getCaseType(currentCase.caseType)
    if (!caseTypeObj || !caseTypeObj.defaultTodos || caseTypeObj.defaultTodos.length === 0) return

    // Check if todos already exist to avoid duplicates
    if (currentCase.todos && currentCase.todos.length > 0) return

    const dates = {
      caseCreation: new Date(disabilityDate),
      dateOfDisability: new Date(disabilityDate),
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
                  .filter((s) => s.active)
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
                {caseTypes
                  .filter((type) => 
                    type.name === "Occupational injury / illness" || 
                    type.name === "Non-occupational injury / illness"
                  )
                  .map((type) => {
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
            <Label htmlFor="case-severity" className="text-sm text-muted-foreground">
              Case severity
            </Label>
            <Input
              id="case-severity"
              placeholder="Enter case severity..."
              className="bg-background"
              value={caseSeverity}
              onChange={(e) => {
                setCaseSeverity(e.target.value)
                handleFieldUpdate("caseSeverity", e.target.value)
              }}
            />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adjuster" className="text-sm text-muted-foreground">
              Adjuster
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
              <SelectTrigger id="adjuster" className="bg-background">
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
              className="bg-background w-40"
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
              className="bg-background w-56"
              value={currentCase?.adjusterEmail || ""}
              onChange={(e) => handleFieldUpdate("adjusterEmail", e.target.value)}
              placeholder="adjuster@example.com"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confidential-case"
              checked={isConfidential}
              onChange={(e) => handleConfidentialChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="confidential-case" className="text-sm font-medium cursor-pointer">
              Confidential Case
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
              Closure Reason
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="case-incident-date" className="text-sm text-muted-foreground">
              Case (incident) date
            </Label>
            <Input
              id="case-incident-date"
              type="date"
              className="bg-background"
              value={caseIncidentDate}
              onChange={(e) => {
                setCaseIncidentDate(e.target.value)
                handleFieldUpdate("caseIncidentDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-incident-time" className="text-sm text-muted-foreground">
              Case (incident) time
            </Label>
            <Input
              id="case-incident-time"
              type="time"
              className="bg-background"
              value={caseIncidentTime}
              onChange={(e) => {
                setCaseIncidentTime(e.target.value)
                handleFieldUpdate("caseIncidentTime", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reported-date" className="text-sm text-muted-foreground">
              Reported date
            </Label>
            <Input
              id="reported-date"
              type="date"
              className="bg-background"
              value={reportedDate}
              onChange={(e) => {
                setReportedDate(e.target.value)
                handleFieldUpdate("reportedDate", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reported-time" className="text-sm text-muted-foreground">
              Reported time
            </Label>
            <Input
              id="reported-time"
              type="time"
              className="bg-background"
              value={reportedTime}
              onChange={(e) => {
                setReportedTime(e.target.value)
                handleFieldUpdate("reportedTime", e.target.value)
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mmi" className="text-sm text-muted-foreground">
              Maximum medical improvement (MMI)
            </Label>
            <Input
              id="mmi"
              type="date"
              className="bg-background"
              value={maximumMedicalImprovement}
              onChange={(e) => {
                setMaximumMedicalImprovement(e.target.value)
                handleFieldUpdate("maximumMedicalImprovement", e.target.value)
              }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Pay Information" icon={<DollarSign className="h-4 w-4" />} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="fica-date" className="text-sm text-muted-foreground">
              FICA Date <span className="text-xs italic">(auto-calculated)</span>
            </Label>
            <Input id="fica-date" type="date" className="bg-muted/50" value={ficaDate} readOnly />
            <p className="text-xs text-muted-foreground mt-1">
              Date of disability + 6 months + first day of next month
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="rate-of-pay" className="text-sm text-muted-foreground">
              Rate of Pay (Mo/Hrly)
            </Label>
            <Input
              id="rate-of-pay"
              placeholder="Enter rate..."
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="std-offset-type" className="text-sm text-muted-foreground">
              STD Offset Type
            </Label>
            <Select>
              <SelectTrigger id="std-offset-type">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ssdi">SSDI</SelectItem>
                <SelectItem value="comp">Workers Comp</SelectItem>
                <SelectItem value="pers">PERS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="std-offset-amount" className="text-sm text-muted-foreground">
              STD Offset Amount
            </Label>
            <Input
              id="std-offset-amount"
              placeholder="Enter amount..."
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="std-offset-frequency" className="text-sm text-muted-foreground">
              STD Offset Frequency
            </Label>
            <Select>
              <SelectTrigger id="std-offset-frequency">
                <SelectValue placeholder="Select frequency..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Short-Term Disability (STD)" icon={<Clock className="h-4 w-4" />} defaultOpen={true}>
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
          </div>
      </CollapsibleSection>

      <CollapsibleSection title="Disability Duration Guidelines (DDG)" icon={<BarChart3 className="h-4 w-4" />} defaultOpen={true}>
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
                Yes
              </label>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      

      <CollapsibleSection title="Work Status Metrics" icon={<BarChart3 className="h-4 w-4" />} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </CollapsibleSection>

      <CollapsibleSection title="Occupational Injury Information" icon={<HardHat className="h-4 w-4" />} defaultOpen={hasOccupationalInjuryData()}>
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
                <SelectItem value="1st shift">1st shift</SelectItem>
                <SelectItem value="2nd shift">2nd shift</SelectItem>
                <SelectItem value="3rd shift">3rd shift</SelectItem>
                <SelectItem value="Day shift">Day shift</SelectItem>
                <SelectItem value="Night shift">Night shift</SelectItem>
                <SelectItem value="Rotating">Rotating</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift-hours" className="text-sm text-muted-foreground">
              Shift hours
            </Label>
            <Select
              value={shiftHours}
              onValueChange={(val) => {
                setShiftHours(val)
                handleFieldUpdate("shiftHours", val)
              }}
            >
              <SelectTrigger id="shift-hours" className="bg-background">
                <SelectValue placeholder="Select shift hours..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="40 hrs">40 hrs</SelectItem>
                <SelectItem value="45 hrs">45 hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift-start-time" className="text-sm text-muted-foreground">
              Shift start time
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
      </CollapsibleSection>

      <CollapsibleSection title="Work Related Details" icon={<Briefcase className="h-4 w-4" />} defaultOpen={hasWorkRelatedData()}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="Under investigation">Under investigation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-occupation" className="text-sm text-muted-foreground">
              Employee occupation
            </Label>
            <Input
              id="employee-occupation"
              placeholder="Enter occupation..."
              className="bg-background"
              value={employeeOccupation}
              onChange={(e) => {
                setEmployeeOccupation(e.target.value)
                handleFieldUpdate("employeeOccupation", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contingent-work" className="text-sm text-muted-foreground">
              Contingent work
            </Label>
            <Select
              value={contingentWork}
              onValueChange={(val) => {
                setContingentWork(val)
                handleFieldUpdate("contingentWork", val)
              }}
            >
              <SelectTrigger id="contingent-work" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
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
          <div className="space-y-2">
            <Label htmlFor="case-extent" className="text-sm text-muted-foreground">
              Case extent
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
          <div className="space-y-2">
            <Label htmlFor="psm-incident" className="text-sm text-muted-foreground">
              PSM incident
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
              Sharps case
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
            <Label htmlFor="wc-claim" className="text-sm text-muted-foreground">
              Workers&apos; comp claim filed?
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
                  Workers&apos; comp claim number
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
                    <SelectItem value="Under review">Under review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                    <SelectItem value="Settled">Settled</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">OSHA recordable?</Label>
            <Select
              value={oshaRecordable}
              onValueChange={(val) => {
                setOshaRecordable(val)
                handleFieldUpdate("oshaRecordable", val)
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {oshaRecordable === "Yes" && (
            <>
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
                    <SelectItem value="Days away from work">Days away from work</SelectItem>
                    <SelectItem value="Job transfer/restriction">Job transfer/restriction</SelectItem>
                    <SelectItem value="Other recordable">Other recordable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recordability-rationale" className="text-sm text-muted-foreground">
                  Recordability rationale
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
            </>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Location Information" icon={<MapPin className="h-4 w-4" />} defaultOpen={hasLocationData()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="location-description" className="text-sm text-muted-foreground">
              Description of where event occurred
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
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="location-address" className="text-sm text-muted-foreground">
              Street address
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
          <div className="space-y-2">
            <Label htmlFor="location-zip" className="text-sm text-muted-foreground">
              Zip code
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
          <div className="space-y-2">
            <Label htmlFor="gps-coordinates" className="text-sm text-muted-foreground">
              GPS coordinates
            </Label>
            <Input
              id="gps-coordinates"
              placeholder="e.g., 40.7128, -74.0060"
              className="bg-background"
              value={gpsCoordinates}
              onChange={(e) => {
                setGpsCoordinates(e.target.value)
                handleFieldUpdate("gpsCoordinates", e.target.value)
              }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Incident Description" icon={<FileText className="h-4 w-4" />} defaultOpen={hasIncidentDescriptionData()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="incident-site-case-number" className="text-sm text-muted-foreground">
              Site case number
            </Label>
            <Input
              id="incident-site-case-number"
              placeholder="Enter site case number..."
              className="bg-background"
              value={siteCaseNumber}
              onChange={(e) => {
                setSiteCaseNumber(e.target.value)
                handleFieldUpdate("siteCaseNumber", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accident-type" className="text-sm text-muted-foreground">
              Accident type
            </Label>
            <Select
              value={accidentType}
              onValueChange={(val) => {
                setAccidentType(val)
                handleFieldUpdate("accidentType", val)
              }}
            >
              <SelectTrigger id="accident-type" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Slip/trip/fall">Slip/trip/fall</SelectItem>
                <SelectItem value="Struck by">Struck by</SelectItem>
                <SelectItem value="Struck against">Struck against</SelectItem>
                <SelectItem value="Caught in/between">Caught in/between</SelectItem>
                <SelectItem value="Overexertion">Overexertion</SelectItem>
                <SelectItem value="Repetitive motion">Repetitive motion</SelectItem>
                <SelectItem value="Exposure">Exposure</SelectItem>
                <SelectItem value="Motor vehicle">Motor vehicle</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serious-injury-fatality" className="text-sm text-muted-foreground">
              Serious injury and fatality (SIF)
            </Label>
            <Select
              value={seriousInjuryFatality}
              onValueChange={(val) => {
                setSeriousInjuryFatality(val)
                handleFieldUpdate("seriousInjuryFatality", val)
              }}
            >
              <SelectTrigger id="serious-injury-fatality" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actual">Actual</SelectItem>
                <SelectItem value="Potential">Potential</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jsa-reference" className="text-sm text-muted-foreground">
              Safety risk assessment (JSA) reference
            </Label>
            <Input
              id="jsa-reference"
              placeholder="JSA reference number..."
              className="bg-background"
              value={jsaReference}
              onChange={(e) => {
                setJsaReference(e.target.value)
                handleFieldUpdate("jsaReference", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="object-substance-caused" className="text-sm text-muted-foreground">
              What object or substance caused the injury
            </Label>
            <Input
              id="object-substance-caused"
              placeholder="e.g., forklift, chemical, ladder"
              className="bg-background"
              value={objectSubstanceCaused}
              onChange={(e) => {
                setObjectSubstanceCaused(e.target.value)
                handleFieldUpdate("objectSubstanceCaused", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="how-injury-happened" className="text-sm text-muted-foreground">
              How the injury happened
            </Label>
            <Input
              id="how-injury-happened"
              placeholder="Describe how injury occurred..."
              className="bg-background"
              value={howInjuryHappened}
              onChange={(e) => {
                setHowInjuryHappened(e.target.value)
                handleFieldUpdate("howInjuryHappened", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-doing-before" className="text-sm text-muted-foreground">
              What the employee was doing before the incident
            </Label>
            <Input
              id="employee-doing-before"
              placeholder="Describe activity before incident..."
              className="bg-background"
              value={employeeDoingBefore}
              onChange={(e) => {
                setEmployeeDoingBefore(e.target.value)
                handleFieldUpdate("employeeDoingBefore", e.target.value)
              }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Injury Details" icon={<Activity className="h-4 w-4" />} defaultOpen={hasInjuryDetailsData()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="Sprain/strain">Sprain/strain</SelectItem>
                <SelectItem value="Fracture">Fracture</SelectItem>
                <SelectItem value="Cut/laceration">Cut/laceration</SelectItem>
                <SelectItem value="Contusion/bruise">Contusion/bruise</SelectItem>
                <SelectItem value="Burn">Burn</SelectItem>
                <SelectItem value="Amputation">Amputation</SelectItem>
                <SelectItem value="Carpal tunnel">Carpal tunnel</SelectItem>
                <SelectItem value="Hernia">Hernia</SelectItem>
                <SelectItem value="Hearing loss">Hearing loss</SelectItem>
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
                <SelectItem value="Fall - same level">Fall - same level</SelectItem>
                <SelectItem value="Fall - different level">Fall - different level</SelectItem>
                <SelectItem value="Struck by object">Struck by object</SelectItem>
                <SelectItem value="Struck against object">Struck against object</SelectItem>
                <SelectItem value="Caught in/between">Caught in/between</SelectItem>
                <SelectItem value="Repetitive motion">Repetitive motion</SelectItem>
                <SelectItem value="Motor vehicle">Motor vehicle</SelectItem>
                <SelectItem value="Exposure - chemical">Exposure - chemical</SelectItem>
                <SelectItem value="Exposure - temperature">Exposure - temperature</SelectItem>
                <SelectItem value="Violence">Violence</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="date-of-death" className="text-sm text-muted-foreground">
              Date of death
            </Label>
            <Input
              id="date-of-death"
              type="date"
              className="bg-background"
              value={dateOfDeath}
              onChange={(e) => {
                setDateOfDeath(e.target.value)
                handleFieldUpdate("dateOfDeath", e.target.value)
              }}
            />
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

        <div className="space-y-2">
          <Label htmlFor="what-employee-doing" className="text-sm text-muted-foreground">
            What was the employee doing just before the incident occurred?
          </Label>
          <textarea
            id="what-employee-doing"
            placeholder="Describe the activity or task the employee was performing..."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={whatEmployeeDoing}
            onChange={(e) => {
              setWhatEmployeeDoing(e.target.value)
              handleFieldUpdate("whatEmployeeDoing", e.target.value)
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="what-happened" className="text-sm text-muted-foreground">
            What happened?
          </Label>
          <textarea
            id="what-happened"
            placeholder="Describe the sequence of events that led to the injury..."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={whatHappened}
            onChange={(e) => {
              setWhatHappened(e.target.value)
              handleFieldUpdate("whatHappened", e.target.value)
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="what-object-harmed" className="text-sm text-muted-foreground">
            What object or substance directly harmed the employee?
          </Label>
          <textarea
            id="what-object-harmed"
            placeholder="Identify the specific object, equipment, substance, or condition..."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={whatObjectHarmed}
            onChange={(e) => {
              setWhatObjectHarmed(e.target.value)
              handleFieldUpdate("whatObjectHarmed", e.target.value)
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Treatment Information" icon={<Stethoscope className="h-4 w-4" />} defaultOpen={hasTreatmentData()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medical-treatment-provided" className="text-sm text-muted-foreground">
              Was medical treatment provided before reporting?
            </Label>
            <Select
              value={medicalTreatmentProvided}
              onValueChange={(val) => {
                setMedicalTreatmentProvided(val)
                handleFieldUpdate("medicalTreatmentProvided", val)
              }}
            >
              <SelectTrigger id="medical-treatment-provided" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="where-treatment-provided" className="text-sm text-muted-foreground">
              Where treatment was provided
            </Label>
            <Select
              value={whereTreatmentProvided}
              onValueChange={(val) => {
                setWhereTreatmentProvided(val)
                handleFieldUpdate("whereTreatmentProvided", val)
              }}
            >
              <SelectTrigger id="where-treatment-provided" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Hospital">Hospital</SelectItem>
                <SelectItem value="External provider">External provider</SelectItem>
                <SelectItem value="Urgent care">Urgent care</SelectItem>
                <SelectItem value="Self-treated">Self-treated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="treated-emergency-room" className="text-sm text-muted-foreground">
              Was employee treated in an emergency room?
            </Label>
            <Select
              value={treatedInEmergencyRoom}
              onValueChange={(val) => {
                setTreatedInEmergencyRoom(val)
                handleFieldUpdate("treatedInEmergencyRoom", val)
              }}
            >
              <SelectTrigger id="treated-emergency-room" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospitalized-overnight" className="text-sm text-muted-foreground">
              Was the employee hospitalized overnight?
            </Label>
            <Select
              value={hospitalizedOvernight}
              onValueChange={(val) => {
                setHospitalizedOvernight(val)
                handleFieldUpdate("hospitalizedOvernight", val)
              }}
            >
              <SelectTrigger id="hospitalized-overnight" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency-transportation" className="text-sm text-muted-foreground">
              Was emergency transportation used?
            </Label>
            <Select
              value={emergencyTransportationUsed}
              onValueChange={(val) => {
                setEmergencyTransportationUsed(val)
                handleFieldUpdate("emergencyTransportationUsed", val)
              }}
            >
              <SelectTrigger id="emergency-transportation" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="case-transferred-3rd-party" className="text-sm text-muted-foreground">
              Was case transferred to 3rd Party Resource/Plant Nurse/Other?
            </Label>
            <Select
              value={caseTransferredTo3rdParty}
              onValueChange={(val) => {
                setCaseTransferredTo3rdParty(val)
                handleFieldUpdate("caseTransferredTo3rdParty", val)
              }}
            >
              <SelectTrigger id="case-transferred-3rd-party" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-requested-treatment" className="text-sm text-muted-foreground">
              Did the employee request treatment or external evaluation?
            </Label>
            <Select
              value={employeeRequestedTreatment}
              onValueChange={(val) => {
                setEmployeeRequestedTreatment(val)
                handleFieldUpdate("employeeRequestedTreatment", val)
              }}
            >
              <SelectTrigger id="employee-requested-treatment" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <Label className="text-sm text-muted-foreground">
            First aid treatments provided
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-md bg-muted/20">
            {[
              "Non-prescription (OTC) medication at non-prescription strength",
              "Tetanus immunizations",
              "Cleaning, flushing or soaking wounds on the surface of the skin",
              "Wound coverings such as BandAids; or using butterfly bandages or Steri-Strips",
              "Hot or cold therapy",
              "Non-rigid means of support",
              "Temporary immobilization devices while transporting an accident victim",
              "Drilling of a finger or toenail to relieve pressure, or draining fluid from a blister",
              "Using eye patches",
              "Removing foreign bodies from the eye using only irrigation or a cotton swab",
              "Removing splinters or foreign material from areas other than the eye by irrigation, tweezers, cotton swabs or other simple means",
              "Using finger guards",
              "Massage (including ART)",
              "Drinking fluids for relief of heat stress",
            ].map((treatment) => (
              <div key={treatment} className="flex items-start space-x-2">
                <Checkbox
                  id={`treatment-${treatment.slice(0, 20).replace(/\s/g, "-")}`}
                  checked={firstAidTreatments.includes(treatment)}
                  onCheckedChange={(checked) => {
                    const newTreatments = checked
                      ? [...firstAidTreatments, treatment]
                      : firstAidTreatments.filter((t) => t !== treatment)
                    setFirstAidTreatments(newTreatments)
                    handleFieldUpdate("firstAidTreatments", newTreatments)
                  }}
                />
                <label
                  htmlFor={`treatment-${treatment.slice(0, 20).replace(/\s/g, "-")}`}
                  className="text-sm leading-tight cursor-pointer"
                >
                  {treatment}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <Label className="text-sm text-muted-foreground">
            Treatments beyond first aid
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-md bg-muted/20">
            {[
              "Prescription medication, or OTC medication used at prescription strength",
              "Wound Closure (surgical glue, sutures, staples)",
              "Immobilization",
              "Physical Therapy/Specialized Care",
              "Medical Procedures",
              "Diagnostics",
              "Respiratory Care",
              "Vaccines",
              "Eye Treatment",
            ].map((treatment) => (
              <div key={treatment} className="flex items-start space-x-2">
                <Checkbox
                  id={`beyond-first-aid-${treatment.slice(0, 20).replace(/\s/g, "-")}`}
                  checked={treatmentsBeyondFirstAid.includes(treatment)}
                  onCheckedChange={(checked) => {
                    const newTreatments = checked
                      ? [...treatmentsBeyondFirstAid, treatment]
                      : treatmentsBeyondFirstAid.filter((t) => t !== treatment)
                    setTreatmentsBeyondFirstAid(newTreatments)
                    handleFieldUpdate("treatmentsBeyondFirstAid", newTreatments)
                  }}
                />
                <label
                  htmlFor={`beyond-first-aid-${treatment.slice(0, 20).replace(/\s/g, "-")}`}
                  className="text-sm leading-tight cursor-pointer"
                >
                  {treatment}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="prescriptions-physical-therapy" className="text-sm text-muted-foreground">
            Prescriptions issues &amp; physical therapy prescribed
          </Label>
          <textarea
            id="prescriptions-physical-therapy"
            placeholder="Enter prescription and physical therapy details..."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={prescriptionsPhysicalTherapy}
            onChange={(e) => {
              setPrescriptionsPhysicalTherapy(e.target.value)
              handleFieldUpdate("prescriptionsPhysicalTherapy", e.target.value)
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="treatment-description" className="text-sm text-muted-foreground">
            Description of treatment
          </Label>
          <textarea
            id="treatment-description"
            placeholder="Describe the treatment provided..."
            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={treatmentDescription}
            onChange={(e) => {
              setTreatmentDescription(e.target.value)
              handleFieldUpdate("treatmentDescription", e.target.value)
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hospital-name" className="text-sm text-muted-foreground">
              Hospital/Facility Name
            </Label>
            <Input
              id="hospital-name"
              placeholder="Hospital or facility name"
              className="bg-background"
              value={hospitalName}
              onChange={(e) => {
                setHospitalName(e.target.value)
                handleFieldUpdate("hospitalName", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospital-address" className="text-sm text-muted-foreground">
              Hospital/Facility Address
            </Label>
            <Input
              id="hospital-address"
              placeholder="Address"
              className="bg-background"
              value={hospitalAddress}
              onChange={(e) => {
                setHospitalAddress(e.target.value)
                handleFieldUpdate("hospitalAddress", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospital-phone" className="text-sm text-muted-foreground">
              Hospital/Facility Phone
            </Label>
            <Input
              id="hospital-phone"
              placeholder="Phone number"
              className="bg-background"
              value={hospitalPhone}
              onChange={(e) => {
                setHospitalPhone(e.target.value)
                handleFieldUpdate("hospitalPhone", e.target.value)
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-information" className="text-sm text-muted-foreground">
            Provider Information
          </Label>
          <Input
            id="provider-information"
            placeholder="Treating physician or provider details"
            className="bg-background"
            value={providerInformation}
            onChange={(e) => {
              setProviderInformation(e.target.value)
              handleFieldUpdate("providerInformation", e.target.value)
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Work Comp Details" icon={<Shield className="h-4 w-4" />} defaultOpen={hasWorkCompData()}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wc-claim-number" className="text-sm text-muted-foreground">
              Claim Number
            </Label>
            <Input
              id="wc-claim-number"
              placeholder="Enter claim number"
              className="bg-background"
              value={wcClaimNumber}
              onChange={(e) => {
                setWcClaimNumber(e.target.value)
                handleFieldUpdate("wcClaimNumber", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjuster-contact" className="text-sm text-muted-foreground">
              Adjuster/Examiner Contact Info
            </Label>
            <Input
              id="adjuster-contact"
              placeholder="Contact information"
              className="bg-background"
              value={adjusterContact}
              onChange={(e) => {
                setAdjusterContact(e.target.value)
                handleFieldUpdate("adjusterContact", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hs-program" className="text-sm text-muted-foreground">
              H&amp;S Program
            </Label>
            <Select
              value={hsProgram}
              onValueChange={(val) => {
                setHsProgram(val)
                handleFieldUpdate("hsProgram", val)
              }}
            >
              <SelectTrigger id="hs-program" className="bg-background">
                <SelectValue placeholder="Select program..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asbestos">Asbestos</SelectItem>
                <SelectItem value="Automobile Safety">Automobile Safety</SelectItem>
                <SelectItem value="Bloodborne Pathogens">Bloodborne Pathogens</SelectItem>
                <SelectItem value="Chemical management">Chemical management</SelectItem>
                <SelectItem value="Confined Space">Confined Space</SelectItem>
                <SelectItem value="Contractor Safety">Contractor Safety</SelectItem>
                <SelectItem value="Cranes, Hoists, Lifting">Cranes, Hoists, Lifting</SelectItem>
                <SelectItem value="Electrical Safety">Electrical Safety</SelectItem>
                <SelectItem value="Emergency Preparedness and Fire Prevention">Emergency Preparedness and Fire Prevention</SelectItem>
                <SelectItem value="Ergonomics">Ergonomics</SelectItem>
                <SelectItem value="Expectations and Performance Appraisals">Expectations and Performance Appraisals</SelectItem>
                <SelectItem value="Hazard Analysis and Regulatory Compliance">Hazard Analysis and Regulatory Compliance</SelectItem>
                <SelectItem value="Hazard Communication">Hazard Communication</SelectItem>
                <SelectItem value="High Risk Operations">High Risk Operations</SelectItem>
                <SelectItem value="Hot Work">Hot Work</SelectItem>
                <SelectItem value="Housekeeping and Inspections">Housekeeping and Inspections</SelectItem>
                <SelectItem value="Incident Reporting, Investigation & Follow-up">Incident Reporting, Investigation &amp; Follow-up</SelectItem>
                <SelectItem value="Industrial Hygiene">Industrial Hygiene</SelectItem>
                <SelectItem value="Line Breaking">Line Breaking</SelectItem>
                <SelectItem value="Lockout Tagout">Lockout Tagout</SelectItem>
                <SelectItem value="Machine Guarding">Machine Guarding</SelectItem>
                <SelectItem value="Management of Change">Management of Change</SelectItem>
                <SelectItem value="Medical Services">Medical Services</SelectItem>
                <SelectItem value="Motor Vehicle Safety">Motor Vehicle Safety</SelectItem>
                <SelectItem value="Occupational Hygiene">Occupational Hygiene</SelectItem>
                <SelectItem value="Personal Protective Equipment">Personal Protective Equipment</SelectItem>
                <SelectItem value="Powered Industrial Vehicles">Powered Industrial Vehicles</SelectItem>
                <SelectItem value="Preventative Maintenance">Preventative Maintenance</SelectItem>
                <SelectItem value="Process Safety Management">Process Safety Management</SelectItem>
                <SelectItem value="Program Evaluation">Program Evaluation</SelectItem>
                <SelectItem value="Safety Risk Assessment (JSA)">Safety Risk Assessment (JSA)</SelectItem>
                <SelectItem value="Site Health and Safety Policy">Site Health and Safety Policy</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Walking Working Surfaces">Walking Working Surfaces</SelectItem>
                <SelectItem value="Working from Heights">Working from Heights</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="process-condition" className="text-sm text-muted-foreground">
              Process condition
            </Label>
            <Select
              value={processCondition}
              onValueChange={(val) => {
                setProcessCondition(val)
                handleFieldUpdate("processCondition", val)
              }}
            >
              <SelectTrigger id="process-condition" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal (Stable) Operations">Normal (Stable) Operations</SelectItem>
                <SelectItem value="Start-up">Start-up</SelectItem>
                <SelectItem value="Upset (abnormal)">Upset (abnormal)</SelectItem>
                <SelectItem value="Maint downtime (planned)">Maint downtime (planned)</SelectItem>
                <SelectItem value="Maint downtime (unplanned)">Maint downtime (unplanned)</SelectItem>
                <SelectItem value="Shutdown (planned)">Shutdown (planned)</SelectItem>
                <SelectItem value="Shutdown (unplanned)">Shutdown (unplanned)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Incident not related to Process Condition">Incident not related to Process Condition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="days-away" className="text-sm text-muted-foreground">
              Days Away
            </Label>
            <Input
              id="days-away"
              type="number"
              placeholder="0"
              className="bg-background"
              value={daysAway}
              onChange={(e) => {
                setDaysAway(e.target.value)
                handleFieldUpdate("daysAway", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days-restricted" className="text-sm text-muted-foreground">
              Days Restricted
            </Label>
            <Input
              id="days-restricted"
              type="number"
              placeholder="0"
              className="bg-background"
              value={daysRestricted}
              onChange={(e) => {
                setDaysRestricted(e.target.value)
                handleFieldUpdate("daysRestricted", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="record-only" className="text-sm text-muted-foreground">
              Record only (not a full claim)?
            </Label>
            <Select
              value={recordOnly}
              onValueChange={(val) => {
                setRecordOnly(val)
                handleFieldUpdate("recordOnly", val)
              }}
            >
              <SelectTrigger id="record-only" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="process-details" className="text-sm text-muted-foreground">
            Process details
          </Label>
          <textarea
            id="process-details"
            placeholder="Enter process details..."
            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={processDetails}
            onChange={(e) => {
              setProcessDetails(e.target.value)
              handleFieldUpdate("processDetails", e.target.value)
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="associated-ii-cases" className="text-sm text-muted-foreground">
              Associated I&amp;I Case(s)
            </Label>
            <Input
              id="associated-ii-cases"
              placeholder="Enter associated case(s)..."
              className="bg-background"
              value={associatedIICases}
              onChange={(e) => {
                setAssociatedIICases(e.target.value)
                handleFieldUpdate("associatedIICases", e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notify-case-management-tpa" className="text-sm text-muted-foreground">
              Notify Case Management and TPA?
            </Label>
            <Select
              value={notifyCaseManagementTPA}
              onValueChange={(val) => {
                setNotifyCaseManagementTPA(val)
                handleFieldUpdate("notifyCaseManagementTPA", val)
              }}
            >
              <SelectTrigger id="notify-case-management-tpa" className="bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="investigation-details" className="text-sm text-muted-foreground">
            Investigation Details
          </Label>
          <textarea
            id="investigation-details"
            placeholder="Enter investigation details..."
            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={investigationDetails}
            onChange={(e) => {
              setInvestigationDetails(e.target.value)
              handleFieldUpdate("investigationDetails", e.target.value)
            }}
          />
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
              Confidential
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Case Dialog - Shows open restrictions and todos */}
      <AlertDialog open={showCloseCaseDialog} onOpenChange={setShowCloseCaseDialog}>
        <AlertDialogContent className="w-[98vw] max-w-5xl h-[95vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Close Case - Review Open Items</AlertDialogTitle>
            <AlertDialogDescription>
              Complete the closure details and review open items before closing the case. All open to-dos must be completed before the case can be closed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Closure Details */}
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <h4 className="font-semibold text-foreground text-sm">Closure Details</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="space-y-1">
                  <Label htmlFor="close-date" className="text-xs">Date Closed *</Label>
                  <Input
                    id="close-date"
                    type="date"
                    value={closeCaseDateClosed}
                    onChange={(e) => setCloseCaseDateClosed(e.target.value)}
                    className="bg-background h-8 text-sm w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="closure-reason" className="text-xs">Closure Reason *</Label>
                  <Select value={closeCaseClosureReason} onValueChange={setCloseCaseClosureReason}>
                    <SelectTrigger className="bg-background h-8 text-sm w-full">
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {codes.caseClosureReason
                        .filter((r) => r.active)
                        .map((reason) => (
                          <SelectItem key={reason.id} value={reason.code}>
                            {reason.description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="actual-return-date" className="text-xs">Actual Return Date</Label>
                  <Input
                    id="actual-return-date"
                    type="date"
                    value={closeCaseActualReturnDate}
                    onChange={(e) => setCloseCaseActualReturnDate(e.target.value)}
                    className="bg-background h-8 text-sm w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="std-end-date" className="text-xs">STD End Date</Label>
                  <Input
                    id="std-end-date"
                    type="date"
                    value={closeCaseStdEndDate}
                    onChange={(e) => setCloseCaseStdEndDate(e.target.value)}
                    className="bg-background h-8 text-sm w-full"
                  />
                </div>
              </div>
            </div>

            {/* Open Absences */}
            {openAbsences.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Open Absences ({openAbsences.length})</h4>
                <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                  {openAbsences.map((absence) => (
                    <div key={absence.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {absence.statusType === "LWD" ? "Lost Work Days" :
                           absence.statusType === "RWD" ? "Restricted Work Days" :
                           absence.statusType === "RWDREGULARJOB" ? "RWD Regular Job" :
                           absence.statusType === "OTH" ? (absence.customOthName || "Other") :
                           absence.statusType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Started: {absence.effectiveDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-xs whitespace-nowrap">Move to Status:</Label>
                        <Select
                          value={closeCaseAbsenceUpdates[absence.id]?.status || ""}
                          onValueChange={(val) => {
                            setCloseCaseAbsenceUpdates((prev) => ({
                              ...prev,
                              [absence.id]: { ...prev[absence.id], status: val }
                            }))
                          }}
                        >
                          <SelectTrigger className="bg-background h-8 text-xs flex-1">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FD">Full Duty</SelectItem>
                            <SelectItem value="LWD">Lost Work Days</SelectItem>
                            <SelectItem value="RWD">Restricted Work Days</SelectItem>
                            <SelectItem value="RWDREGULARJOB">RWD Regular Job</SelectItem>
                            <SelectItem value="OTH">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {closeCaseAbsenceUpdates[absence.id]?.status === "OTH" && (
                          <Select
                            value={closeCaseAbsenceUpdates[absence.id]?.otherStatus || ""}
                            onValueChange={(val) => {
                              setCloseCaseAbsenceUpdates((prev) => ({
                                ...prev,
                                [absence.id]: { ...prev[absence.id], otherStatus: val }
                              }))
                            }}
                          >
                            <SelectTrigger className="bg-background h-8 text-xs w-48">
                              <SelectValue placeholder="Select absence status *" />
                            </SelectTrigger>
                            <SelectContent>
                              {codes.absenceStatus
                                ?.filter((s) => s.active)
                                .map((status) => (
                                  <SelectItem key={status.id} value={status.code}>
                                    {status.description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Restrictions */}
            {openRestrictions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Active Restrictions ({openRestrictions.length})</h4>
                <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                  {openRestrictions.map((restriction) => (
                    <div key={restriction.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{restriction.restriction}</span>
                        <span className="text-xs text-muted-foreground">
                          Started: {restriction.startDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap">End Date:</Label>
                          <Input
                            type="date"
                            value={closeCaseRestrictionUpdates[restriction.id]?.endDate || ""}
                            onChange={(e) => {
                              setCloseCaseRestrictionUpdates((prev) => ({
                                ...prev,
                                [restriction.id]: { 
                                  ...prev[restriction.id], 
                                  endDate: e.target.value,
                                  isPermanent: false 
                                }
                              }))
                            }}
                            disabled={closeCaseRestrictionUpdates[restriction.id]?.isPermanent}
                            className="bg-background h-8 text-xs w-36"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`permanent-${restriction.id}`}
                            checked={closeCaseRestrictionUpdates[restriction.id]?.isPermanent || false}
                            onCheckedChange={(checked) => {
                              setCloseCaseRestrictionUpdates((prev) => ({
                                ...prev,
                                [restriction.id]: { 
                                  ...prev[restriction.id], 
                                  isPermanent: checked as boolean,
                                  endDate: checked ? "" : prev[restriction.id]?.endDate
                                }
                              }))
                            }}
                          />
                          <Label htmlFor={`permanent-${restriction.id}`} className="text-xs cursor-pointer">
                            Permanent
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open To-Dos */}
            {openTodos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm">Open To-Dos ({openTodos.length})</h4>
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
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {openTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-3 p-2 hover:bg-muted/50">
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
          </div>

          <AlertDialogFooter className="border-t pt-4">
            <AlertDialogCancel onClick={() => {
              setPendingStatus(null)
              setCloseCaseAbsenceUpdates({})
              setCloseCaseRestrictionUpdates({})
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                !closeCaseDateClosed || 
                !closeCaseClosureReason ||
                // Check if any absence with OTH status is missing the required otherStatus
                openAbsences.some((absence) => 
                  closeCaseAbsenceUpdates[absence.id]?.status === "OTH" && 
                  !closeCaseAbsenceUpdates[absence.id]?.otherStatus
                ) ||
                // Prevent closing if there are open todos not selected to close
                (openTodos.length > 0 && selectedTodosToClose.length < openTodos.length) ||
                // Prevent closing if there are active restrictions that are not marked as permanent
                openRestrictions.some((restriction) => {
                  const updates = closeCaseRestrictionUpdates[restriction.id]
                  // Check if the restriction is permanent (either originally or via update)
                  const isPermanent = updates?.isPermanent || restriction.isPermanent
                  // If not permanent, case cannot be closed
                  return !isPermanent
                })
              }
              onClick={() => {
                // Close selected todos
                if (currentCase && selectedTodosToClose.length > 0) {
                  const updatedTodos = currentCase.todos?.map((todo) => {
                    if (selectedTodosToClose.includes(todo.id)) {
                      return { ...todo, completed: true, dateClosed: closeCaseDateClosed }
                    }
                    return todo
                  })
                  updateCase(currentCase.caseNumber, { todos: updatedTodos })
                }

                // Update restrictions
                Object.entries(closeCaseRestrictionUpdates).forEach(([restrictionId, updates]) => {
                  if (updates.endDate || updates.isPermanent) {
                    updateRestriction(restrictionId, { 
                      isActive: updates.isPermanent ? true : false,
                      endDate: updates.endDate || undefined,
                      isPermanent: updates.isPermanent || false
                    })
                  }
                })

                // Update absences
                if (currentCase && Object.keys(closeCaseAbsenceUpdates).length > 0) {
                  const updatedAbsences = currentCase.absences?.map((absence) => {
                    const update = closeCaseAbsenceUpdates[absence.id]
                    if (update?.status) {
                      return {
                        ...absence,
                        statusType: update.status as typeof absence.statusType,
                        customOthName: update.status === "OTH" ? update.otherStatus : absence.customOthName
                      }
                    }
                    return absence
                  })
                  updateCase(currentCase.caseNumber, { absences: updatedAbsences })
                }

                // Update case with closure details and status
                const caseUpdates: Record<string, any> = {
                  dateClosed: closeCaseDateClosed,
                  closureReason: closeCaseClosureReason,
                }
                if (closeCaseActualReturnDate) {
                  caseUpdates.actualReturnDate = closeCaseActualReturnDate
                }
                if (closeCaseStdEndDate) {
                  caseUpdates.stdEndDate = closeCaseStdEndDate
                }
                if (pendingStatus) {
                  caseUpdates.status = pendingStatus
                  setStatus(pendingStatus)
                }
                
                updateCase(currentCase!.caseNumber, caseUpdates, {
                  action: "updated",
                  field: "status",
                  oldValue: currentCase?.status,
                  newValue: pendingStatus || "Closed",
                  description: `Case closed: ${codes.caseClosureReason.find(r => r.code === closeCaseClosureReason)?.description || closeCaseClosureReason}`
                })

                // Reset dialog state
                setShowCloseCaseDialog(false)
                setPendingStatus(null)
                setCloseCaseAbsenceUpdates({})
                setCloseCaseRestrictionUpdates({})
                setCloseCaseDateClosed(new Date().toISOString().split("T")[0])
                setCloseCaseClosureReason("")
                setCloseCaseActualReturnDate("")
                setCloseCaseStdEndDate("")
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

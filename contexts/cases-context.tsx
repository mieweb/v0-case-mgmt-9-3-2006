"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { debug } from "@/lib/debug"

export interface AbsenceEntry {
  id: string
  effectiveDate: string
  status: string
  statusType: "FD" | "LWD" | "RWD" | "RWDREGULARJOB" | "OTH"
  customOthName?: string
  days: {
    FD: number
    LWD: number
    RWD: number
    RWDREGULARJOB: number
    OTH: number
  }
}

export interface Restriction {
  id: string
  caseNumber: string
  restriction: string
  startDate: string
  endDate?: string
  reviewDate?: string
  isPermanent: boolean
  isActive: boolean
  notes?: string
}

export interface CaseNoteVersion {
  id: string
  content: string
  editedBy: string
  editedAt: string
}

export interface CaseNote {
  id: string
  caseNumber: string
  noteDate: string
  activity: string
  caseManager: string
  notes: string
  createdBy: string
  dateEntered: string
  lineout: boolean
  lineoutDate?: string
  isLocked: boolean
  lockedBy?: string
  lockedAt?: string
  versions: CaseNoteVersion[]
  currentVersion: number
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: "created" | "updated" | "added" | "removed"
  field: string
  oldValue?: string
  newValue?: string
  userName: string
  description: string
}

export interface Diagnosis {
  id: string
  caseNumber: string
  icd10Code: string
  icd10Description: string
  diagnosisDate: string
  priority: number // 1 = primary, 2 = secondary, etc.
  isActive: boolean
  notes?: string
  createdBy: string
  createdAt: string
}

export interface Case {
  caseNumber: string
  employeeName: string
  employeeNumber: string
  employeeLocation: string
  status: "Open" | "Pending" | "Closed"
  caseType: string
  caseCategory: string
  caseManager: string
  created: string
  lastUpdated: string
  confidential?: boolean // Added confidential flag to replace CONF case type
  absences?: AbsenceEntry[]
  diagnoses?: Diagnosis[]
  employeeClass?: string
  dateOfBirth?: string
  address?: string
  age?: number
  employmentType?: "Hourly" | "Salaried"
  callCenter?: string
  originalHireDate?: string
  adjustedServiceDate?: string
  cellPhone?: string
  gender?: string
  position?: string
  entryDate?: string
  terminationDate?: string
  emergencyRelation?: string
  emergencyWorkPhone?: string
  emergencyContact?: string
  unionDescription?: string
  homePhone?: string
  personalEmail?: string
  dateClosed?: string
  closureReason?: string
  dateOfDisability?: string
  initialContactDate?: string
  adjuster?: string
  adjusterPhone?: string
  adjusterEmail?: string
  actualReturnDate?: string
  deliveryDate?: string
  expectedConfinementDate?: string
  stdPlan?: string
  stdStartDate?: string
  pmdDays?: string
  pmdDate?: string
  ddgDays?: string
  ddgReturnDate?: string
  hcpContactedWithin7Days?: boolean
  expectedReturnDate?: string
  daysLost?: string
  daysRestricted?: string
  payStartDate?: string
  payEndDate?: string
  ficaDate?: string // Added FICA tracking date field for automatic calculation
  todos?: TodoItem[]
  caseNotes?: CaseNote[]
  activityLog?: ActivityLogEntry[]
  contacts?: CaseContact[]
}

export interface TodoItem {
  id: string
  dateScheduled?: string
  activity: string
  caseManager: string
  completed: boolean
  dateClosed?: string
  linkedLetterId?: string
}

export interface CaseContact {
  id: string
  contactId: string
  name: string
  email: string
  phone: string
  type: string[]
  relationship: string
  isPrimary: boolean
  isActive: boolean
  caseNumber: string
}

interface CasesContextType {
  cases: Case[]
  addCase: (caseData: Partial<Case>) => void
  updateCase: (caseNumber: string, updates: Partial<Case>, activityEntry?: Partial<ActivityLogEntry>) => void
  getCase: (caseNumber: string) => Case | undefined
  currentCase: Case | null
  setCurrentCase: (caseData: Case | null) => void
  restrictions: Restriction[]
  addRestriction: (restriction: Omit<Restriction, "id">) => void
  updateRestriction: (id: string, updates: Partial<Restriction>) => void
  deleteRestriction: (id: string) => void
  getRestrictionsForEmployee: (employeeNumber: string) => Restriction[]
}

const CasesContext = createContext<CasesContextType | undefined>(undefined)

const initialRestrictions: Restriction[] = [
  {
    id: "r1",
    caseNumber: "20251101-2234",
    restriction: "No Lifting Over 25 lbs",
    startDate: "2025-09-01",
    endDate: "2025-12-01",
    reviewDate: "2025-11-01",
    isPermanent: false,
    isActive: true,
    notes: "Post-surgery restriction",
  },
  {
    id: "r2",
    caseNumber: "20251101-2234",
    restriction: "No Prolonged Standing",
    startDate: "2025-09-01",
    endDate: "2025-11-15",
    isPermanent: false,
    isActive: false,
    notes: "Completed restriction period",
  },
  {
    id: "r3",
    caseNumber: "20251030-1123",
    restriction: "Light Duty Only",
    startDate: "2025-10-15",
    reviewDate: "2025-12-15",
    isPermanent: false,
    isActive: true,
    notes: "Back injury recovery",
  },
]

const initialCases: Case[] = [
  {
    caseNumber: "20251102-3351",
    employeeName: "John Smith",
    employeeNumber: "EMP-12345",
    employeeLocation: "Toledo, OH",
    status: "Open",
    caseType: "Short-term Disability",
    caseCategory: "",
    caseManager: "Unassigned",
    created: "11/2/2025",
    lastUpdated: "11/2/2025",
    dateOfDisability: "10/25/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1985-06-15",
    address: "123 Main St, Toledo, OH 43606",
    age: 40,
    employmentType: "Hourly",
    callCenter: "N/A",
    originalHireDate: "2010-03-15",
    adjustedServiceDate: "2010-03-15",
    cellPhone: "(419) 555-0123",
    gender: "Male",
    position: "Production Operator",
    entryDate: "2010-03-15",
    emergencyContact: "Jane Smith",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(419) 555-0124",
    homePhone: "(419) 555-0125",
    personalEmail: "john.smith@email.com",
    unionDescription: "UAW Local 12",
    todos: [],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251102-3351",
        userName: "Unassigned",
        description: `Case 20251102-3351 created`,
      },
    ],
  },
  {
    caseNumber: "20251101-2234",
    employeeName: "Sarah Johnson",
    employeeNumber: "EMP-67890",
    employeeLocation: "Newark, OH",
    status: "Open",
    caseType: "Maternity",
    caseCategory: "",
    caseManager: "Manager 1",
    created: "11/1/2025",
    lastUpdated: "11/2/2025",
    dateOfDisability: "08/15/2025",
    absences: [
      {
        id: "1",
        effectiveDate: "2025-08-19",
        status: "FD — Full Duty",
        statusType: "FD",
        days: { FD: 14, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0 },
      },
      {
        id: "2",
        effectiveDate: "2025-09-02",
        status: "OTH — Light Admin Duty",
        statusType: "OTH",
        customOthName: "Light Admin Duty",
        days: { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 6 },
      },
      {
        id: "3",
        effectiveDate: "2025-09-08",
        status: "RWDREGULARJOB — OSHA Full Duty (Restrictions, no job impact)",
        statusType: "RWDREGULARJOB",
        days: { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 20, OTH: 0 },
      },
      {
        id: "4",
        effectiveDate: "2025-09-28",
        status: "RWD — Restricted Work Days",
        statusType: "RWD",
        days: { FD: 0, LWD: 0, RWD: 12, RWDREGULARJOB: 0, OTH: 0 },
      },
      {
        id: "5",
        effectiveDate: "2025-10-10",
        status: "LWD — Lost Work Days",
        statusType: "LWD",
        days: { FD: 0, LWD: 10, RWD: 0, RWDREGULARJOB: 0, OTH: 0 },
      },
      {
        id: "6",
        effectiveDate: "2025-10-20",
        status: "FD — Full Duty",
        statusType: "FD",
        days: { FD: 8, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0 },
      },
      {
        id: "7",
        effectiveDate: "2025-10-28",
        status: "RWD — Restricted Work Days",
        statusType: "RWD",
        days: { FD: 0, LWD: 0, RWD: 20, RWDREGULARJOB: 0, OTH: 0 },
      },
    ],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1990-09-22",
    address: "456 Oak Ave, Newark, OH 43055",
    age: 35,
    employmentType: "Salaried",
    callCenter: "N/A",
    originalHireDate: "2015-07-01",
    adjustedServiceDate: "2015-07-01",
    cellPhone: "(740) 555-0234",
    gender: "Female",
    position: "Quality Control Specialist",
    entryDate: "2015-07-01",
    emergencyContact: "Michael Johnson",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(740) 555-0235",
    homePhone: "(740) 555-0236",
    personalEmail: "sarah.johnson@email.com",
    unionDescription: "Non-Union",
    todos: [],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251101-2234",
        userName: "Manager 1",
        description: `Case 20251101-2234 created`,
      },
    ],
  },
  {
    caseNumber: "20251030-1123",
    employeeName: "Michael Davis",
    employeeNumber: "EMP-45678",
    employeeLocation: "Granville, OH",
    status: "Pending",
    caseType: "Long-term Disability",
    caseCategory: "",
    caseManager: "Manager 2",
    created: "10/30/2025",
    lastUpdated: "11/1/2025",
    dateOfDisability: "10/15/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1978-03-10",
    address: "789 Elm St, Granville, OH 43023",
    age: 47,
    employmentType: "Salaried",
    callCenter: "N/A",
    originalHireDate: "2005-01-20",
    adjustedServiceDate: "2005-01-20",
    cellPhone: "(740) 555-0345",
    gender: "Male",
    position: "Maintenance Supervisor",
    entryDate: "2005-01-20",
    emergencyContact: "Lisa Davis",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(740) 555-0346",
    homePhone: "(740) 555-0347",
    personalEmail: "michael.davis@email.com",
    unionDescription: "IBEW Local 683",
    todos: [],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251030-1123",
        userName: "Manager 2",
        description: `Case 20251030-1123 created`,
      },
    ],
  },
  {
    caseNumber: "20251029-9988",
    employeeName: "Emily Brown",
    employeeNumber: "EMP-13579",
    employeeLocation: "Kansas City, KS",
    status: "Closed",
    caseType: "Workers Comp",
    caseCategory: "",
    caseManager: "Manager 1",
    created: "10/29/2025",
    lastUpdated: "10/31/2025",
    dateOfDisability: "10/20/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1992-11-05",
    address: "321 Pine Rd, Kansas City, KS 66102",
    age: 33,
    employmentType: "Hourly",
    callCenter: "N/A",
    originalHireDate: "2018-04-12",
    adjustedServiceDate: "2018-04-12",
    cellPhone: "(913) 555-0456",
    gender: "Female",
    position: "Warehouse Associate",
    entryDate: "2018-04-12",
    emergencyContact: "Robert Brown",
    emergencyRelation: "Father",
    emergencyWorkPhone: "(913) 555-0457",
    homePhone: "(913) 555-0458",
    personalEmail: "emily.brown@email.com",
    unionDescription: "Teamsters Local 41",
    todos: [],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251029-9988",
        userName: "Manager 1",
        description: `Case 20251029-9988 created`,
      },
    ],
  },
]

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>(initialCases)
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [restrictions, setRestrictions] = useState<Restriction[]>(initialRestrictions)

  const addCase = (caseData: Partial<Case>) => {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "")
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const caseNumber = `${dateStr}-${randomNum}`

    const timestamp = now.toLocaleDateString("en-US")

    const newCase: Case = {
      caseNumber,
      employeeName: caseData.employeeName || "",
      employeeNumber: caseData.employeeNumber || "",
      employeeLocation: caseData.employeeLocation || "",
      status: caseData.status || "Open",
      caseType: caseData.caseType || "",
      caseCategory: caseData.caseCategory || "",
      caseManager: caseData.caseManager || "Unassigned",
      created: timestamp,
      lastUpdated: timestamp,
      dateOfDisability: caseData.dateOfDisability || "",
      absences: [],
      diagnoses: [],
      contacts: [],
      todos: [],
      caseNotes: [],
      activityLog: [
        {
          id: `activity-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "created",
          field: "case",
          newValue: caseNumber,
          userName: caseData.caseManager || "System",
          description: `Case ${caseNumber} created`,
        },
      ],
      ...caseData,
    }

    setCases((prev) => [newCase, ...prev])
    setCurrentCase(newCase)

    debug("New case created:", newCase)
  }

  const updateCase = (caseNumber: string, updates: Partial<Case>, activityEntry?: Partial<ActivityLogEntry>) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.caseNumber === caseNumber) {
          const activityLog = c.activityLog || []
          const now = new Date().toISOString()
          const userName = c.caseManager || "System"

          if (activityEntry) {
            activityLog.push({
              id: `activity-${Date.now()}`,
              timestamp: now,
              action: activityEntry.action || "updated",
              field: activityEntry.field || "",
              oldValue: activityEntry.oldValue,
              newValue: activityEntry.newValue,
              userName: activityEntry.userName || userName,
              description: activityEntry.description || "",
            })
          } else {
            Object.entries(updates).forEach(([field, newValue]) => {
              const oldValue = c[field as keyof Case]

              if (field === "lastUpdated" || field === "activityLog") return

              let description = ""

              if (field === "contacts") {
                const oldCount = (oldValue as CaseContact[] | undefined)?.length || 0
                const newCount = (newValue as CaseContact[] | undefined)?.length || 0
                if (newCount > oldCount) {
                  description = "Added contact"
                } else if (newCount < oldCount) {
                  description = "Removed contact"
                } else {
                  description = "Updated contact"
                }
              } else if (field === "absences") {
                const oldCount = (oldValue as AbsenceEntry[] | undefined)?.length || 0
                const newCount = (newValue as AbsenceEntry[] | undefined)?.length || 0
                if (newCount > oldCount) {
                  description = "Added absence entry"
                } else if (newCount < oldCount) {
                  description = "Removed absence entry"
                } else {
                  description = "Updated absence entry"
                }
              } else if (field === "todos") {
                const oldCount = (oldValue as TodoItem[] | undefined)?.length || 0
                const newCount = (newValue as TodoItem[] | undefined)?.length || 0
                if (newCount > oldCount) {
                  description = "Added todo item"
                } else if (newCount < oldCount) {
                  description = "Removed todo item"
                } else {
                  description = "Updated todo item"
                }
              } else if (field === "caseNotes") {
                const oldCount = (oldValue as CaseNote[] | undefined)?.length || 0
                const newCount = (newValue as CaseNote[] | undefined)?.length || 0
                if (newCount > oldCount) {
                  description = "Added case note"
                }
              } else if (field === "status") {
                description = `Changed status from ${oldValue} to ${newValue}`
              } else if (field === "caseManager") {
                description = `Reassigned case from ${oldValue} to ${newValue}`
              } else if (field === "caseType") {
                description = `Changed case type to ${newValue}`
              } else if (field === "diagnoses") {
                const oldCount = (oldValue as Diagnosis[] | undefined)?.length || 0
                const newCount = (newValue as Diagnosis[] | undefined)?.length || 0
                if (newCount > oldCount) {
                  description = "Added diagnosis"
                } else if (newCount < oldCount) {
                  description = "Removed diagnosis"
                } else {
                  description = "Updated diagnosis"
                }
              } else if (field === "ficaDate") {
                description = `Updated FICA tracking date`
              } else if (field === "confidential") {
                description = `Updated confidential flag`
              } else {
                const fieldName = field.replace(/([A-Z])/g, " $1").trim()
                description = `Updated ${fieldName}`
              }

              activityLog.push({
                id: `activity-${Date.now()}-${field}`,
                timestamp: now,
                action: "updated",
                field,
                oldValue: typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue || ""),
                newValue: typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue || ""),
                userName,
                description,
              })
            })
          }

          return {
            ...c,
            ...updates,
            lastUpdated: new Date().toLocaleDateString("en-US"),
            activityLog,
          }
        }
        return c
      }),
    )

    if (currentCase?.caseNumber === caseNumber) {
      setCurrentCase((prev) => (prev ? { ...prev, ...updates } : null))
    }

    debug("Case updated:", caseNumber, updates)
  }

  const addRestriction = (restriction: Omit<Restriction, "id">) => {
    const newRestriction: Restriction = {
      ...restriction,
      id: `r${Date.now()}`,
    }
    setRestrictions((prev) => [...prev, newRestriction])

    const caseToUpdate = cases.find((c) => c.caseNumber === restriction.caseNumber)
    if (caseToUpdate) {
      const activityLog = caseToUpdate.activityLog || []
      activityLog.push({
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "added",
        field: "restrictions",
        newValue: restriction.restriction,
        userName: caseToUpdate.caseManager,
        description: `Added restriction: ${restriction.restriction}`,
      })
      updateCase(restriction.caseNumber, { activityLog })
    }
  }

  const updateRestriction = (id: string, updates: Partial<Restriction>) => {
    const restriction = restrictions.find((r) => r.id === id)
    setRestrictions((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))

    if (restriction) {
      const caseToUpdate = cases.find((c) => c.caseNumber === restriction.caseNumber)
      if (caseToUpdate) {
        const activityLog = caseToUpdate.activityLog || []
        activityLog.push({
          id: `activity-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "updated",
          field: "restrictions",
          oldValue: restriction.restriction,
          newValue: updates.restriction || restriction.restriction,
          userName: caseToUpdate.caseManager,
          description: `Updated restriction: ${restriction.restriction}`,
        })
        updateCase(restriction.caseNumber, { activityLog })
      }
    }
  }

  const deleteRestriction = (id: string) => {
    const restriction = restrictions.find((r) => r.id === id)
    setRestrictions((prev) => prev.filter((r) => r.id !== id))

    if (restriction) {
      const caseToUpdate = cases.find((c) => c.caseNumber === restriction.caseNumber)
      if (caseToUpdate) {
        const activityLog = caseToUpdate.activityLog || []
        activityLog.push({
          id: `activity-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "removed",
          field: "restrictions",
          oldValue: restriction.restriction,
          userName: caseToUpdate.caseManager,
          description: `Removed restriction: ${restriction.restriction}`,
        })
        updateCase(restriction.caseNumber, { activityLog })
      }
    }
  }

  const getCase = (caseNumber: string) => {
    return cases.find((c) => c.caseNumber === caseNumber)
  }

  const getRestrictionsForEmployee = (employeeNumber: string) => {
    const employeeCases = cases.filter((c) => c.employeeNumber === employeeNumber)
    const employeeCaseNumbers = employeeCases.map((c) => c.caseNumber)

    return restrictions.filter((r) => employeeCaseNumbers.includes(r.caseNumber))
  }

  return (
    <CasesContext.Provider
      value={{
        cases,
        addCase,
        updateCase,
        getCase,
        currentCase,
        setCurrentCase,
        restrictions,
        addRestriction,
        updateRestriction,
        deleteRestriction,
        getRestrictionsForEmployee,
      }}
    >
      {children}
    </CasesContext.Provider>
  )
}

export function useCases() {
  const context = useContext(CasesContext)
  if (context === undefined) {
    throw new Error("useCases must be used within a CasesProvider")
  }
  return context
}

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

export interface ADATrackingEntry {
  id: string
  date: string
  status: "Approved" | "Denied" | "Pending" | "Review Due" | "Closed"
  description: string
  reviewDate?: string // One year from approval for annual review
  notes?: string
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
  isADAAccommodation?: boolean // Flag for ADA-related restrictions
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
  deletedBy?: string
  deletedAt?: string
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
  adaTracking?: ADATrackingEntry[]
  lastWorkDate?: string
  returnToWorkDate?: string
  fileDate?: string
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
  // ADA Accommodation Restrictions for sample ADA case
  {
    id: "r4-ada",
    caseNumber: "20250901-ADA1",
    restriction: "Modified Workstation - Ergonomic Chair and Standing Desk",
    startDate: "2025-09-06",
    reviewDate: "2026-09-06", // Annual review date
    isPermanent: true,
    isActive: true,
    notes: "ADA Approved accommodation for chronic back condition",
    isADAAccommodation: true,
  },
  {
    id: "r5-ada",
    caseNumber: "20250901-ADA1",
    restriction: "Flexible Break Schedule - 10 min break every 2 hours",
    startDate: "2025-09-06",
    reviewDate: "2026-09-06", // Annual review date
    isPermanent: true,
    isActive: true,
    notes: "ADA Approved accommodation",
    isADAAccommodation: true,
  },
]

// Helper to generate dates relative to today
const getRelativeDate = (daysFromNow: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split("T")[0]
}

const initialCases: Case[] = [
  {
    caseNumber: "20251102-3351",
    employeeName: "John Smith",
    employeeNumber: "EMP-12345",
    employeeLocation: "Toledo, OH",
    status: "Open",
    caseType: "Short-term Disability",
    caseCategory: "",
    caseManager: "Arlene Rosario, CPDM",
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
    todos: [
      { id: "todo-ar-1", dateScheduled: getRelativeDate(-2), activity: "Review initial claim documentation", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-2", dateScheduled: getRelativeDate(0), activity: "Contact employee for intake interview", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-3", dateScheduled: getRelativeDate(1), activity: "Complete draft letter - Initial Acknowledgment", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-4", dateScheduled: getRelativeDate(3), activity: "Follow up on pending documentation", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-5", dateScheduled: getRelativeDate(5), activity: "Schedule RTW planning meeting", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-6", dateScheduled: getRelativeDate(7), activity: "Review FCE results", caseManager: "Arlene Rosario, CPDM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251102-3351",
        userName: "Arlene Rosario, CPDM",
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
    caseManager: "Debbie Swann, RN, CCM",
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
    todos: [
      { id: "todo-ds-1", dateScheduled: getRelativeDate(-3), activity: "Review maternity leave request", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-2", dateScheduled: getRelativeDate(-1), activity: "Confirm expected delivery date", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-3", dateScheduled: getRelativeDate(0), activity: "Complete draft letter - FMLA Approval Notice", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-4", dateScheduled: getRelativeDate(2), activity: "Coordinate with HR on leave dates", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-5", dateScheduled: getRelativeDate(4), activity: "Send benefits continuation notice", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-6", dateScheduled: getRelativeDate(6), activity: "Schedule return-to-work check-in", caseManager: "Debbie Swann, RN, CCM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251101-2234",
        userName: "Debbie Swann, RN, CCM",
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
    caseManager: "Kate Gilligan, BSN, RN, CCM",
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
    todos: [
      { id: "todo-kg-1", dateScheduled: getRelativeDate(-5), activity: "Review LTD application", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-2", dateScheduled: getRelativeDate(-2), activity: "Request specialist consultation notes", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-3", dateScheduled: getRelativeDate(0), activity: "Coordinate IME appointment", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-4", dateScheduled: getRelativeDate(3), activity: "Follow up with treating physician", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-5", dateScheduled: getRelativeDate(7), activity: "Complete draft letter - LTD Determination Notice", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-6", dateScheduled: getRelativeDate(10), activity: "Prepare case summary for review", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251030-1123",
        userName: "Kate Gilligan, BSN, RN, CCM",
        description: `Case 20251030-1123 created`,
      },
    ],
  },
  {
    caseNumber: "20251029-9988",
    employeeName: "Emily Brown",
    employeeNumber: "EMP-13579",
    employeeLocation: "Kansas City, KS",
    status: "Open",
    caseType: "Workers Comp",
    caseCategory: "",
    caseManager: "Arlene Rosario, CPDM",
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
    todos: [
      { id: "todo-ar-7", dateScheduled: getRelativeDate(-4), activity: "File initial WC claim with carrier", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-8", dateScheduled: getRelativeDate(-1), activity: "Obtain incident report from supervisor", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-9", dateScheduled: getRelativeDate(1), activity: "Schedule ergonomic assessment", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-10", dateScheduled: getRelativeDate(4), activity: "Complete draft letter - Modified Duty Offer", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-11", dateScheduled: getRelativeDate(8), activity: "Coordinate with safety department", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-12", dateScheduled: getRelativeDate(12), activity: "Prepare modified duty options", caseManager: "Arlene Rosario, CPDM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251029-9988",
        userName: "Arlene Rosario, CPDM",
        description: `Case 20251029-9988 created`,
      },
    ],
  },
  {
    caseNumber: "20251028-7765",
    employeeName: "Robert Wilson",
    employeeNumber: "EMP-24680",
    employeeLocation: "Columbus, OH",
    status: "Open",
    caseType: "Short-term Disability",
    caseCategory: "",
    caseManager: "Debbie Swann, RN, CCM",
    created: "10/28/2025",
    lastUpdated: "10/30/2025",
    dateOfDisability: "10/22/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1982-07-18",
    address: "555 Maple Dr, Columbus, OH 43215",
    age: 43,
    employmentType: "Salaried",
    callCenter: "N/A",
    originalHireDate: "2012-09-05",
    adjustedServiceDate: "2012-09-05",
    cellPhone: "(614) 555-0567",
    gender: "Male",
    position: "IT Systems Analyst",
    entryDate: "2012-09-05",
    emergencyContact: "Susan Wilson",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(614) 555-0568",
    homePhone: "(614) 555-0569",
    personalEmail: "robert.wilson@email.com",
    unionDescription: "Non-Union",
    todos: [
      { id: "todo-ds-7", dateScheduled: getRelativeDate(-6), activity: "Review surgical pre-authorization", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-8", dateScheduled: getRelativeDate(-3), activity: "Contact surgeon office for procedure date", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-9", dateScheduled: getRelativeDate(0), activity: "Process short-term disability forms", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-10", dateScheduled: getRelativeDate(2), activity: "Complete draft letter - RTW Clearance Request", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-11", dateScheduled: getRelativeDate(5), activity: "Schedule 2-week follow-up call", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-12", dateScheduled: getRelativeDate(9), activity: "Review recovery timeline with employee", caseManager: "Debbie Swann, RN, CCM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251028-7765",
        userName: "Debbie Swann, RN, CCM",
        description: `Case 20251028-7765 created`,
      },
    ],
  },
  {
    caseNumber: "20251027-5543",
    employeeName: "Jennifer Martinez",
    employeeNumber: "EMP-35791",
    employeeLocation: "Cleveland, OH",
    status: "Open",
    caseType: "Workers Comp",
    caseCategory: "",
    caseManager: "Kate Gilligan, BSN, RN, CCM",
    created: "10/27/2025",
    lastUpdated: "10/29/2025",
    dateOfDisability: "10/18/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1988-12-03",
    address: "789 Cedar Ln, Cleveland, OH 44114",
    age: 37,
    employmentType: "Hourly",
    callCenter: "N/A",
    originalHireDate: "2016-02-28",
    adjustedServiceDate: "2016-02-28",
    cellPhone: "(216) 555-0678",
    gender: "Female",
    position: "Assembly Line Worker",
    entryDate: "2016-02-28",
    emergencyContact: "Carlos Martinez",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(216) 555-0679",
    homePhone: "(216) 555-0680",
    personalEmail: "jennifer.martinez@email.com",
    unionDescription: "UAW Local 1005",
    todos: [
      { id: "todo-kg-7", dateScheduled: getRelativeDate(-7), activity: "Review WC claim for back injury", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-8", dateScheduled: getRelativeDate(-4), activity: "Coordinate MRI scheduling", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-9", dateScheduled: getRelativeDate(-1), activity: "Follow up on imaging results", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-10", dateScheduled: getRelativeDate(2), activity: "Complete draft letter - Medical Update Request", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-11", dateScheduled: getRelativeDate(6), activity: "Schedule physical therapy evaluation", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-12", dateScheduled: getRelativeDate(10), activity: "Review work restrictions with supervisor", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251027-5543",
        userName: "Kate Gilligan, BSN, RN, CCM",
        description: `Case 20251027-5543 created`,
      },
    ],
  },
  {
    caseNumber: "20251026-3321",
    employeeName: "David Thompson",
    employeeNumber: "EMP-46802",
    employeeLocation: "Cincinnati, OH",
    status: "Open",
    caseType: "Long-term Disability",
    caseCategory: "",
    caseManager: "Arlene Rosario, CPDM",
    created: "10/26/2025",
    lastUpdated: "10/28/2025",
    dateOfDisability: "09/15/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1975-04-25",
    address: "456 Walnut St, Cincinnati, OH 45202",
    age: 50,
    employmentType: "Salaried",
    callCenter: "N/A",
    originalHireDate: "2000-08-15",
    adjustedServiceDate: "2000-08-15",
    cellPhone: "(513) 555-0789",
    gender: "Male",
    position: "Senior Engineer",
    entryDate: "2000-08-15",
    emergencyContact: "Patricia Thompson",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(513) 555-0790",
    homePhone: "(513) 555-0791",
    personalEmail: "david.thompson@email.com",
    unionDescription: "Non-Union",
    todos: [
      { id: "todo-ar-13", dateScheduled: getRelativeDate(-8), activity: "Review LTD transition from STD", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-14", dateScheduled: getRelativeDate(-5), activity: "Request updated medical records", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-15", dateScheduled: getRelativeDate(-2), activity: "Coordinate with LTD carrier", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-16", dateScheduled: getRelativeDate(1), activity: "Review SSDI application status", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-17", dateScheduled: getRelativeDate(5), activity: "Schedule vocational rehabilitation consult", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ar-18", dateScheduled: getRelativeDate(14), activity: "30-day case review meeting", caseManager: "Arlene Rosario, CPDM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251026-3321",
        userName: "Arlene Rosario, CPDM",
        description: `Case 20251026-3321 created`,
      },
    ],
  },
  {
    caseNumber: "20251025-1198",
    employeeName: "Amanda Garcia",
    employeeNumber: "EMP-57913",
    employeeLocation: "Dayton, OH",
    status: "Open",
    caseType: "Maternity",
    caseCategory: "",
    caseManager: "Debbie Swann, RN, CCM",
    created: "10/25/2025",
    lastUpdated: "10/27/2025",
    dateOfDisability: "10/20/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1993-08-14",
    address: "123 Valley Rd, Dayton, OH 45402",
    age: 32,
    employmentType: "Salaried",
    callCenter: "N/A",
    originalHireDate: "2019-05-20",
    adjustedServiceDate: "2019-05-20",
    cellPhone: "(937) 555-0890",
    gender: "Female",
    position: "Marketing Coordinator",
    entryDate: "2019-05-20",
    emergencyContact: "Luis Garcia",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(937) 555-0891",
    homePhone: "(937) 555-0892",
    personalEmail: "amanda.garcia@email.com",
    unionDescription: "Non-Union",
    todos: [
      { id: "todo-ds-13", dateScheduled: getRelativeDate(-9), activity: "Process maternity leave paperwork", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-14", dateScheduled: getRelativeDate(-6), activity: "Verify FMLA eligibility", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-15", dateScheduled: getRelativeDate(-3), activity: "Confirm delivery date with physician", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-16", dateScheduled: getRelativeDate(0), activity: "Send leave confirmation letter", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-17", dateScheduled: getRelativeDate(4), activity: "Review bonding leave options", caseManager: "Debbie Swann, RN, CCM", completed: false },
      { id: "todo-ds-18", dateScheduled: getRelativeDate(8), activity: "Plan gradual return-to-work schedule", caseManager: "Debbie Swann, RN, CCM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251025-1198",
        userName: "Debbie Swann, RN, CCM",
        description: `Case 20251025-1198 created`,
      },
    ],
  },
  {
    caseNumber: "20251024-8876",
    employeeName: "Christopher Lee",
    employeeNumber: "EMP-68024",
    employeeLocation: "Akron, OH",
    status: "Open",
    caseType: "Workers Comp",
    caseCategory: "",
    caseManager: "Kate Gilligan, BSN, RN, CCM",
    created: "10/24/2025",
    lastUpdated: "10/26/2025",
    dateOfDisability: "10/16/2025",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1980-01-30",
    address: "789 Summit Rd, Akron, OH 44301",
    age: 45,
    employmentType: "Hourly",
    callCenter: "N/A",
    originalHireDate: "2008-11-10",
    adjustedServiceDate: "2008-11-10",
    cellPhone: "(330) 555-0901",
    gender: "Male",
    position: "Forklift Operator",
    entryDate: "2008-11-10",
    emergencyContact: "Michelle Lee",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(330) 555-0902",
    homePhone: "(330) 555-0903",
    personalEmail: "christopher.lee@email.com",
    unionDescription: "Teamsters Local 24",
    todos: [
      { id: "todo-kg-13", dateScheduled: getRelativeDate(-10), activity: "File WC claim for shoulder injury", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-14", dateScheduled: getRelativeDate(-7), activity: "Obtain witness statements", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-15", dateScheduled: getRelativeDate(-4), activity: "Review orthopedic evaluation", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-16", dateScheduled: getRelativeDate(-1), activity: "Coordinate with WC adjuster", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-17", dateScheduled: getRelativeDate(3), activity: "Schedule follow-up with specialist", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
      { id: "todo-kg-18", dateScheduled: getRelativeDate(7), activity: "Review modified duty assignment", caseManager: "Kate Gilligan, BSN, RN, CCM", completed: false },
    ],
    caseNotes: [],
    activityLog: [
      {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "created",
        field: "case",
        newValue: "20251024-8876",
        userName: "Kate Gilligan, BSN, RN, CCM",
        description: `Case 20251024-8876 created`,
      },
    ],
  },
  // Sample ADA Tracking Case with full history
  {
    caseNumber: "20250901-ADA1",
    employeeName: "Michael Rodriguez",
    employeeNumber: "EMP-ADA01",
    employeeLocation: "Columbus, OH",
    status: "Open",
    caseType: "ADA Accommodation",
    caseCategory: "Accommodation Request",
    caseManager: "Arlene Rosario, CPDM",
    created: "9/1/2025",
    lastUpdated: "9/6/2025",
    dateOfDisability: "2025-08-15",
    lastWorkDate: "2025-09-01",
    returnToWorkDate: "2025-09-05",
    fileDate: "2025-09-06",
    absences: [],
    diagnoses: [],
    contacts: [],
    employeeClass: "Full-Time",
    dateOfBirth: "1978-03-22",
    address: "456 Oak Avenue, Columbus, OH 43215",
    age: 47,
    employmentType: "Salaried",
    callCenter: "N/A",
    originalHireDate: "2008-06-01",
    adjustedServiceDate: "2008-06-01",
    cellPhone: "(614) 555-0198",
    gender: "Male",
    position: "Senior Analyst",
    entryDate: "2008-06-01",
    emergencyContact: "Maria Rodriguez",
    emergencyRelation: "Spouse",
    emergencyWorkPhone: "(614) 555-0199",
    homePhone: "(614) 555-0197",
    personalEmail: "m.rodriguez@email.com",
    unionDescription: "Non-Union",
    todos: [
      { id: "todo-ada-1", dateScheduled: "2026-09-06", activity: "ADA Annual Review - Modified Workstation", caseManager: "Arlene Rosario, CPDM", completed: false },
      { id: "todo-ada-2", dateScheduled: "2026-09-06", activity: "ADA Annual Review - Flexible Break Schedule", caseManager: "Arlene Rosario, CPDM", completed: false },
    ],
    caseNotes: [
      {
        id: "note-ada-1",
        createdAt: "2025-09-01T09:00:00Z",
        updatedAt: "2025-09-01T09:00:00Z",
        content: "Employee reported chronic back condition affecting ability to sit for extended periods. Requested ADA accommodation evaluation.",
        author: "Arlene Rosario, CPDM",
        noteType: "General",
        versions: [],
      },
      {
        id: "note-ada-2",
        createdAt: "2025-09-05T14:00:00Z",
        updatedAt: "2025-09-05T14:00:00Z",
        content: "Employee returned to work with temporary restrictions pending ADA determination.",
        author: "Arlene Rosario, CPDM",
        noteType: "General",
        versions: [],
      },
      {
        id: "note-ada-3",
        createdAt: "2025-09-06T10:00:00Z",
        updatedAt: "2025-09-06T10:00:00Z",
        content: "ADA Accommodation APPROVED. Employee will receive ergonomic workstation modifications and flexible break schedule. Annual review scheduled for 9/6/2026.",
        author: "Arlene Rosario, CPDM",
        noteType: "General",
        versions: [],
      },
    ],
    adaTracking: [
      {
        id: "ada-1",
        date: "2025-09-01",
        status: "Pending",
        description: "ADA accommodation request received - chronic back condition",
        notes: "Employee submitted medical documentation from treating physician",
      },
      {
        id: "ada-2",
        date: "2025-09-05",
        status: "Pending",
        description: "Interactive process meeting completed with employee and supervisor",
        notes: "Discussed potential accommodations including ergonomic equipment and schedule modifications",
      },
      {
        id: "ada-3",
        date: "2025-09-06",
        status: "Approved",
        description: "ADA Accommodation Approved - Ergonomic workstation and flexible breaks",
        reviewDate: "2026-09-06",
        notes: "Restrictions added to Restrictions tab. Annual review notice generated for 9/6/2026.",
      },
    ],
    activityLog: [
      {
        id: "activity-ada-1",
        timestamp: "2025-09-01T08:00:00Z",
        action: "created",
        field: "case",
        newValue: "20250901-ADA1",
        userName: "Arlene Rosario, CPDM",
        description: "Case 20250901-ADA1 created - ADA Accommodation Request",
      },
      {
        id: "activity-ada-2",
        timestamp: "2025-09-01T08:00:00Z",
        action: "updated",
        field: "lastWorkDate",
        newValue: "2025-09-01",
        userName: "Arlene Rosario, CPDM",
        description: "Last Work Date (LWD) set to 9/1/2025",
      },
      {
        id: "activity-ada-3",
        timestamp: "2025-09-05T08:00:00Z",
        action: "updated",
        field: "returnToWorkDate",
        newValue: "2025-09-05",
        userName: "Arlene Rosario, CPDM",
        description: "Return to Work Date (RWD) set to 9/5/2025",
      },
      {
        id: "activity-ada-4",
        timestamp: "2025-09-06T10:00:00Z",
        action: "updated",
        field: "adaStatus",
        newValue: "Approved",
        userName: "Arlene Rosario, CPDM",
        description: "ADA Accommodation Approved - Annual review scheduled for 9/6/2026",
      },
      {
        id: "activity-ada-5",
        timestamp: "2025-09-06T10:00:00Z",
        action: "added",
        field: "restrictions",
        newValue: "Modified Workstation - Ergonomic Chair and Standing Desk",
        userName: "Arlene Rosario, CPDM",
        description: "ADA Accommodation restriction added",
      },
      {
        id: "activity-ada-6",
        timestamp: "2025-09-06T10:00:00Z",
        action: "added",
        field: "restrictions",
        newValue: "Flexible Break Schedule - 10 min break every 2 hours",
        userName: "Arlene Rosario, CPDM",
        description: "ADA Accommodation restriction added",
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

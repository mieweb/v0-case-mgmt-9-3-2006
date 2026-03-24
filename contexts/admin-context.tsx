"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface CaseType {
  id: string
  name: string
  defaultTodos: string[]
  confidential: boolean // Added confidential attribute
}

export interface Code {
  id: string
  code: string
  name?: string // Added name field for letter templates
  description?: string
  active: boolean
  content?: string // Added content field to store Mustache template
}

export interface CaseManager {
  id: string
  name: string
  active: boolean
}

interface CodeTables {
  letterTemplates: Code[]
  caseStatus: Code[]
  caseCategory: Code[]
  caseClosureReason: Code[]
  contactType: Code[]
  absenceStatus: Code[]
  absenceReason: Code[]
  restrictionCodes: Code[]
  caseActivity: Code[]
  documentType: Code[]
}

interface AdminContextType {
  caseTypes: CaseType[]
  addCaseType: (caseType: Omit<CaseType, "id">) => void
  updateCaseType: (id: string, updates: Partial<Omit<CaseType, "id">>) => void
  deleteCaseType: (id: string) => void
  getCaseType: (name: string) => CaseType | undefined
  caseManagers: CaseManager[]
  addCaseManager: (caseManager: Omit<CaseManager, "id">) => void
  updateCaseManager: (id: string, updates: Partial<Omit<CaseManager, "id">>) => void
  deleteCaseManager: (id: string) => void
  codes: CodeTables
  addCode: (table: keyof CodeTables, code: Omit<Code, "id">) => void
  updateCode: (table: keyof CodeTables, id: string, updates: Partial<Omit<Code, "id">>) => void
  deleteCode: (table: keyof CodeTables, id: string) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

const initialCaseTypes: CaseType[] = [
  {
    id: "7",
    name: "CONF — Confidential Type Case",
    defaultTodos: [],
    confidential: true,
  },
  {
    id: "2",
    name: "MAT — Maternity",
    defaultTodos: [
      `Update Call; offset=0 Week; rrule=FREQ=WEEKLY;INTERVAL=2`,
      `C-SEC 6 weeks drop pay to D60; anchor=surgeryDate; offset=6 Week`,
      `Vag - 6 weeks RTW in EC; anchor=deliveryDate; offset=6 Week`,
      `C-Sec 8 weeks RTW pay to 100%; anchor=surgeryDate; offset=8 Week`,
      `HA review; offset=1 Month`,
      `Initial Assessment-MAT; offset=1 Month`,
      `Job Description; offset=1 Month`,
      `Monthly Reassessment; offset=1 Month; rrule=FREQ=MONTHLY;INTERVAL=1;COUNT=17`,
      `wellness discussion; offset=1 Month`,
      `SSDI referral; offset=5 Month`,
      `FICA Exempt-MAT; offset=7 Month`,
      `LTD Application; offset=12 Month`,
      `WTBO estimate; offset=12 Month`,
      `LTD Application Reminder; offset=14 Month`,
      `LTD App Submission; offset=15 Month`,
    ],
    confidential: false,
  },
  {
    id: "3",
    name: "MHSA — Mental Health Substance Abuse",
    defaultTodos: [
      "Gather complete medical records",
      "Review policy coverage and waiting period",
      "Contact employee and treatment provider",
      "Coordinate with insurance carrier",
      "Set up monthly check-ins",
      "Ensure privacy protections are in place",
    ],
    confidential: true,
  },
  {
    id: "4",
    name: "NLT — No Lost Time Non-Occupational",
    defaultTodos: [
      "Document injury/illness details",
      "Review restrictions and accommodations",
      "Contact employee for status update",
      "Coordinate with supervisor on modified duty",
      "Monitor return to full duty",
    ],
    confidential: false,
  },
  {
    id: "5",
    name: "NON — Non-occupational injury / illness",
    defaultTodos: [
      "Request medical documentation from employee",
      "Review claim eligibility",
      "Contact employee for initial assessment",
      "Schedule follow-up call",
      "Submit claim to insurance carrier",
    ],
    confidential: false,
  },
  {
    id: "6",
    name: "OCC — Occupational injury / illness",
    defaultTodos: [
      "File incident report",
      "Document accident details",
      "Contact workers comp carrier",
      "Schedule medical evaluation",
      "Review safety protocols",
      "Coordinate with safety team",
    ],
    confidential: false,
  },
  ]

const initialCodeTables: CodeTables = {
  letterTemplates: [
    {
      id: "1",
      code: "initial-contact",
      name: "Initial Contact",
      description: "Initial contact letter to employee",
      active: true,
      content: `Dear {{employeeName}},

This letter is to confirm that we have received your request for leave under case number {{caseNumber}}.

Your case manager, {{caseManager}}, will be handling your case and will contact you within 2-3 business days to discuss next steps.

If you have any questions, please don't hesitate to reach out.

Sincerely,
Case Management Team`,
    },
    {
      id: "2",
      code: "request-documents",
      name: "Request Documents",
      description: "Request for medical documentation",
      active: true,
      content: `Dear {{employeeName}},

Regarding your case {{caseNumber}}, we need additional medical documentation to process your claim.

Please provide the following documents by {{today}}:
- Medical certification from your healthcare provider
- Treatment plan and expected duration
- Any relevant test results

Please submit documents to your case manager {{caseManager}}.

Thank you for your cooperation.

Best regards,
Case Management Team`,
    },
    {
      id: "3",
      code: "approval",
      name: "Approval Letter",
      description: "Claim approval notification",
      active: true,
      content: `Dear {{employeeName}},

We are pleased to inform you that your {{caseType}} claim (Case #{{caseNumber}}) has been approved.

Your benefits will begin on {{stdStartDate}} and your expected return to work date is {{expectedReturnDate}}.

If you have any questions about your benefits, please contact {{caseManager}}.

Congratulations,
Case Management Team`,
    },
    {
      id: "4",
      code: "denial",
      name: "Denial Letter",
      description: "Claim denial notification",
      active: true,
      content: `Dear {{employeeName}},

After careful review, we regret to inform you that your claim (Case #{{caseNumber}}) has been denied.

Reason: [Please provide specific reason]

You have the right to appeal this decision within 30 days. Please contact {{caseManager}} for more information about the appeals process.

Sincerely,
Case Management Team`,
    },
  ],
  caseStatus: [
    { id: "1", code: "ACTIVE", description: "Active", active: true },
    { id: "2", code: "CLOSED", description: "Closed", active: true },
    { id: "3", code: "OPEN", description: "Open", active: true },
    { id: "4", code: "PEND", description: "Pending", active: true },
    { id: "5", code: "REOPEN", description: "Re-opened", active: true },
    { id: "6", code: "COMP", description: "Completed", active: true },
    { id: "7", code: "OVER", description: "Overdue", active: true },
  ],
  caseCategory: [
    { id: "1", code: "CORRECT", description: "DX Is Correct", active: true },
    { id: "2", code: "DX NotKnow", description: "DX Not known", active: true },
    { id: "3", code: "DXWrkUp", description: "DX Being Worked Up", active: true },
    { id: "4", code: "INCORRECT", description: "DX Is Incorrect", active: true },
    { id: "5", code: "PLAUSIBLE", description: "DX Is Plausible", active: true },
    { id: "6", code: "PROB CORR", description: "DX Is Probably Correct", active: true },
    { id: "7", code: "PROB INCOR", description: "DX Is Probably Incorrect", active: true },
  ],
  caseClosureReason: [
    { id: "1", code: "AppNotRcd", description: "Emp failed to return timely STD App", active: true },
    { id: "2", code: "BEN", description: "Benefits/Compensation Denied", active: true },
    { id: "3", code: "DEATH", description: "Death of Employee", active: true },
    { id: "4", code: "DUP", description: "Duplicate Case-Do not count", active: true },
    { id: "5", code: "FULL", description: "Full / Final WC Settlement", active: true },
    { id: "6", code: "INTERFMLA", description: "Intermittent FMLA", active: true },
    { id: "7", code: "LOA", description: "Leave of Absence (Personal)", active: true },
    { id: "8", code: "LTD", description: "Long Term Disability Approved", active: true },
    { id: "9", code: "LTD Denied", description: "Long Term Disability Denied", active: true },
    { id: "10", code: "Not LTDelg", description: "Not Eligible for LTD - Completed STD", active: true },
    { id: "11", code: "OTH", description: "Other Closure Reason Not Listed", active: true },
    { id: "12", code: "OUT", description: "RTW Outside Owens Corning", active: true },
    { id: "13", code: "REFUSE", description: "RTW Options Refused by Employee", active: true },
    { id: "14", code: "RET", description: "Retired", active: true },
    { id: "15", code: "RTW", description: "Employee RTW Full Duty", active: true },
    { id: "16", code: "RTW-PmtRst", description: "Employee RTW with permanent restriction(s)", active: true },
    { id: "17", code: "STD Denied", description: "Disability Denied", active: true },
    { id: "18", code: "TERM", description: "Termination of Employment", active: true },
    { id: "19", code: "WC Case Closed", description: "Workers Comp Case Closed", active: true },
    { id: "20", code: "WC Denied", description: "Workers Compensation Denied", active: true },
    { id: "21", code: "WTBO", description: "Work Transition Benefit", active: true },
  ],
  contactType: [
    { id: "1", code: "AMBULANCE", description: "Ambulance EMS", active: true },
    { id: "2", code: "ATTN", description: "Attorney", active: true },
    { id: "3", code: "Consultant", description: "Consultant", active: true },
    { id: "4", code: "DC", description: "Doctor of Chiropractic", active: true },
    { id: "5", code: "DDS", description: "Dentist", active: true },
    { id: "6", code: "DO", description: "Doctor of Osteopathic", active: true },
    { id: "7", code: "DPM", description: "Doctor of Podiatry", active: true },
    { id: "8", code: "EMPLOYEE", description: "Employee", active: true },
    { id: "9", code: "EPA", description: "EPA", active: true },
    { id: "10", code: "FAMILY", description: "Family Member", active: true },
    { id: "11", code: "FIRE", description: "Fire Department", active: true },
    { id: "12", code: "FNP", description: "Family Nurse Practitioner", active: true },
    { id: "13", code: "IME", description: "Independent Medical Exam", active: true },
    { id: "14", code: "LTD", description: "LTD Provider Contact", active: true },
    { id: "15", code: "MD", description: "Medical Doctor", active: true },
    { id: "16", code: "NP", description: "Nurse Practitioner", active: true },
    { id: "17", code: "OHN", description: "Occupational Health Nurse", active: true },
    { id: "18", code: "OSHA", description: "OSHA", active: true },
    { id: "19", code: "Other", description: "Other", active: true },
    { id: "20", code: "PA", description: "Physician Assistant", active: true },
    { id: "21", code: "PHD", description: "Doctor of Psychology", active: true },
    { id: "22", code: "POA", description: "Power of Attorney", active: true },
    { id: "23", code: "POLICE", description: "Police Department", active: true },
    { id: "24", code: "PT", description: "Physical Therapist", active: true },
    { id: "25", code: "SOCWORK", description: "Social Worker", active: true },
    { id: "26", code: "SPEC", description: "Doctor Of Specialty", active: true },
    { id: "27", code: "SSDI", description: "SSDI Contact", active: true },
    { id: "28", code: "SUBSCOUNS", description: "Substance Abuse Counselor", active: true },
    { id: "29", code: "TPA", description: "Third Party Administrator", active: true },
    { id: "30", code: "VOCREHAB", description: "Vocational Rehabilitation Counselor", active: true },
    { id: "31", code: "Witness", description: "Witness", active: true },
  ],
  absenceStatus: [
    { id: "1", code: "FD — Full Duty", active: true },
    { id: "2", code: "LWD — Lost Work Days", active: true },
    { id: "3", code: "RWD — Restricted Work Days", active: true },
    { id: "4", code: "RWDREGULARJOB — OSHA Full Duty", active: true },
    { id: "5", code: "OTH — Other", active: true },
  ],
  absenceReason: [
    { id: "1", code: "ADAAPPROVED", description: "ADA Approved", active: true },
    { id: "2", code: "ADADENIED", description: "ADA Request Denied", active: true },
    { id: "3", code: "COVIDPAY", description: "EE Received Covid Pay from OC", active: true },
    { id: "4", code: "DEATH", description: "Death of Employee", active: true },
    { id: "5", code: "LTD", description: "LTD- Long Term Disability Approved", active: true },
    { id: "6", code: "LTD-DENIED", description: "LTD Denied -Terminated", active: true },
    { id: "7", code: "LTD-RETIRED", description: "LTD Denied - Retired", active: true },
    { id: "8", code: "NEWCASE", description: "See New Case", active: true },
    { id: "9", code: "NONADAAPPROVED", description: "Non ADA Restriction-Accommodation Accepted", active: true },
    { id: "10", code: "NONADADENIED", description: "Non ADA restriction-Unable to Accommodate", active: true },
    { id: "11", code: "OSHAREGJO", description: "OSHA RWD Regular Job", active: true },
    { id: "12", code: "OUTSIDEOC", description: "Employment Outside OC", active: true },
    { id: "13", code: "RETIRED", description: "Employee Retired", active: true },
    { id: "14", code: "RTW W/PERM REST", description: "Returned to Work with Permanent Restrictions", active: true },
    { id: "15", code: "STDDENIED", description: "STD Denied", active: true },
    { id: "16", code: "STDENDED", description: "STD ended-ee did not apply for LTD", active: true },
    { id: "17", code: "TER", description: "Terminated Employment", active: true },
  ],
  restrictionCodes: [
    { id: "1", code: "ALTSAS", description: "Alternate between Standing / Sitting As Tolerated", active: true },
    { id: "2", code: "ALTSITSTD", description: "Alternate between Standing / Sitting As Tolerated", active: true },
    { id: "3", code: "CLOSESUPER", description: "Close Supervision Recommended", active: true },
    { id: "4", code: "COVIDACCOM", description: "COVID accommodation", active: true },
    { id: "5", code: "CRUTCHES", description: "Use Crutches", active: true },
    { id: "6", code: "DENIED", description: "ADA Request Denied", active: true },
    { id: "7", code: "DNCLIMB", description: "Do Not Climb or Work on Heights", active: true },
    { id: "8", code: "DNCSTR", description: "Do Not climb Stairs Ladders or Elevations", active: true },
    { id: "9", code: "DNDMVCOBUS", description: "Do Not Drive Motor Vehicles On Company Business", active: true },
    { id: "10", code: "DNOHAZMACH", description: "Do Not Operate hazard Machinery", active: true },
    { id: "11", code: "DNUHASUPP", description: "Do Not Climb Where Hand / Arm Support is Required", active: true },
    { id: "12", code: "DNUPDEQP", description: "Do Not Use Potentially Dangerous Equipment", active: true },
    { id: "13", code: "DNURESP", description: "Do Not Use Respirator", active: true },
    { id: "14", code: "DNWERPLUGS", description: "Do not wear Earplugs or Inserts", active: true },
    { id: "15", code: "DNWISOLATE", description: "Do Not Work In Isolated Areas", active: true },
    { id: "16", code: "DNWRESPREQ", description: "Do Not Work Where Respirator Is Required", active: true },
    { id: "17", code: "DNWRKALONE", description: "Do Not Work Alone", active: true },
    { id: "18", code: "DNWRKMDEV", description: "Do Not Work Pending Further Medical Evaluation", active: true },
    { id: "19", code: "DNWRKMDTX", description: "Do Not Work Pending Further Medical Treatment", active: true },
    { id: "20", code: "DNWRKMVEQ", description: "Do Not Work Around Moving Equipment", active: true },
    { id: "21", code: "DOTDEFINED", description: "Do Not Operate DOT Vehicles At Speeds Over (    )", active: true },
    { id: "22", code: "EMF", description: "No work around areas of increased Electromagnetic Field", active: true },
    { id: "23", code: "FTACCURAHR", description: "Field Test Required for Ability To Accurately Hear", active: true },
    { id: "24", code: "KBPCAD", description: "Keep Body Part Clean And Dry", active: true },
    { id: "25", code: "KNEEBRACE", description: "Knee Brace must be worn", active: true },
    { id: "26", code: "LBTWAIST", description: "Limited Bending or Twisting At the Waist", active: true },
    { id: "27", code: "LCARRYING", description: "Limited Carrying", active: true },
    { id: "28", code: "LCARYCONT", description: "Limit Carrying Continuously Defined", active: true },
    { id: "29", code: "LCARYFREQ", description: "Limit Carrying Frequently Defined", active: true },
    { id: "30", code: "LCARYOCC", description: "Limit Carrying Occasionally Defined", active: true },
    { id: "31", code: "LCOLDEXPO", description: "Limited Exposure To Cold", active: true },
    { id: "32", code: "LCONCHEM", description: "Limited Contact with Chemicals", active: true },
    { id: "33", code: "LDOTCOVERV", description: "Do Not Operate DOT Covered Vehicles", active: true },
    { id: "34", code: "LDRIVING", description: "Limited Driving", active: true },
    { id: "35", code: "LEXDUSMGA", description: "Limited Exposure To Dust, Smoke, Gases", active: true },
    { id: "36", code: "LEXPOHAZRD", description: "Avoid Electrical Mechanical And Chemical Hazards", active: true },
    { id: "37", code: "LEXPOHEAT", description: "Limited Exposure To Heat", active: true },
    { id: "38", code: "LEXSKIRRIT", description: "Limited Exposure to Skin Irritant", active: true },
    { id: "39", code: "LFFRGTHAND", description: "Limited Fine Fingering With L Hand", active: true },
    { id: "40", code: "LLIFTCONT", description: "Limit Lifting Continuously Defined", active: true },
    { id: "41", code: "LLIFTFREQ", description: "Limit Lifting Frequently Defined", active: true },
    { id: "42", code: "LLIFTOCC", description: "Limit Lifting Occasionally Defined", active: true },
    { id: "43", code: "LMTravel", description: "Limited Travel", active: true },
    { id: "44", code: "LNOISEXPO", description: "Limit Noise Exposure Greater Than Defined DB", active: true },
    { id: "45", code: "LP60", description: "Limit Push, Pull, Lift to 60 lbs", active: true },
    { id: "46", code: "LPP", description: "Limit Pushing / Pulling Undefined", active: true },
    { id: "47", code: "LPP 25", description: "Limited Pushing / Pulling 25 lbs", active: true },
    { id: "48", code: "LPP 35", description: "Limited Pushing / Pulling 35 lbs", active: true },
    { id: "49", code: "LPP10", description: "Limited Pushing / Pulling 10 lbs", active: true },
    { id: "50", code: "LPP15", description: "Limited Pushing / Pulling 15 lbs", active: true },
    { id: "51", code: "LPP20", description: "Limited Pushing / Pulling 20 lbs", active: true },
    { id: "52", code: "LPP30", description: "Limited Pushing / Pulling 30 lbs", active: true },
    { id: "53", code: "LPP40", description: "Limited Pushing / Pulling 40 lbs", active: true },
    { id: "54", code: "LPP45", description: "Limited Pushing / Pulling 45 lbs", active: true },
    { id: "55", code: "LPP5", description: "Limited Pushing / Pulling 5 lbs", active: true },
    { id: "56", code: "LPP50", description: "Limited Pushing / Pulling 50 lbs", active: true },
    { id: "57", code: "LPP60", description: "Limit Pushing / Pulling Over 60 lbs", active: true },
    { id: "58", code: "LQLREFLEX", description: "Limit Quick Lower Reflexes", active: true },
    { id: "59", code: "LQUREFLEX", description: "Limit Quick Upper Reflexes", active: true },
    { id: "60", code: "LREPOHEAD", description: "Limited Repetitive Extreme Positions of Head", active: true },
    { id: "61", code: "LREQADV", description: "Avoid Work Requiring Acute Distance Vision", active: true },
    { id: "62", code: "LREQFNV", description: "Avoid Work Requiring Fine Near Vision", active: true },
    { id: "63", code: "LROTATSHFT", description: "Avoid Rotating Or Irregular Shifts", active: true },
    { id: "64", code: "LSEXERTION", description: "Limit Strenuous Physical Exertion", active: true },
    { id: "65", code: "LSHIFTWRK", description: "Specify Shift Work Recommended", active: true },
    { id: "66", code: "LSITTING", description: "Limited Sitting", active: true },
    { id: "67", code: "LSTAND", description: "Limited Standing ______hrs per day", active: true },
    { id: "68", code: "LULE", description: "Limited Repetitive Use of Lower Extremities", active: true },
    { id: "69", code: "LURESP", description: "Avoid Using Respirator", active: true },
    { id: "70", code: "LUUE", description: "Limited Repetitive Use of Upper Extremities", active: true },
    { id: "71", code: "LVOCAL", description: "Do Not Give Vocal Instructions", active: true },
    { id: "72", code: "LWALKING", description: "No Walking More Than Defined Hours Per Day", active: true },
    { id: "73", code: "LWDISTVISN", description: "Limit Work Requiring Acute Distance Vision", active: true },
    { id: "74", code: "LWFINEVISN", description: "Limit Work Requiring Fine Near Vision", active: true },
    { id: "75", code: "LWLKSTD", description: "Limited Walking / Standing", active: true },
    { id: "76", code: "NBTWAIST", description: "No Bending or Twisting At The Waist", active: true },
    { id: "77", code: "NCARRYING", description: "No Carrying", active: true },
    { id: "78", code: "NCOWOUS", description: "No Climbing Walking On Uneven Surfaces", active: true },
    { id: "79", code: "NCRAWLING", description: "No Crawling", active: true },
    { id: "80", code: "NDRIVING", description: "No Driving", active: true },
    { id: "81", code: "NFFLEFTHND", description: "Limited Fine Fingering With R Hand", active: true },
    { id: "82", code: "NFFRGTHAND", description: "No Fine Fingering With Right Hand", active: true },
    { id: "83", code: "NFORKLIFT", description: "Do Not Operate Forklift", active: true },
    { id: "84", code: "NGPLEFTHND", description: "No Gripping / Pinching with L Hand", active: true },
    { id: "85", code: "NGPRIGTHND", description: "No Gripping / Pinching with R Hand", active: true },
    { id: "86", code: "NKNEELING", description: "No Kneeling", active: true },
    { id: "87", code: "NL", description: "No Lifting", active: true },
    { id: "88", code: "NL10", description: "No Lifting over 10 lbs", active: true },
    { id: "89", code: "NL15", description: "No Lifting over 15 lbs", active: true },
    { id: "90", code: "NL20", description: "No Lifting over 20 lbs", active: true },
    { id: "91", code: "NL25", description: "No Lifting over 25 lbs", active: true },
    { id: "92", code: "NL30", description: "No Lifting over 30 lbs", active: true },
    { id: "93", code: "NL35", description: "No Lifting over 35 lbs", active: true },
    { id: "94", code: "NL40", description: "No Lifting over 40 lbs", active: true },
    { id: "95", code: "NL5", description: "No Lifting over 5 lbs", active: true },
    { id: "96", code: "NL50", description: "No Lifting over 50 lbs", active: true },
    { id: "97", code: "NLA", description: "No Lifting Above ________ Level", active: true },
    { id: "98", code: "NLASL", description: "No Lifting Above Shoulder Level", active: true },
    { id: "99", code: "NLAWL", description: "No Lifting Above Waist Level", active: true },
    { id: "100", code: "NLBWL", description: "No Lifting Below Waist Level", active: true },
    { id: "101", code: "NLEFTARM", description: "No Use of Left Arm", active: true },
    { id: "102", code: "NLFT THUMB", description: "No Use of Left Thumb", active: true },
    { id: "103", code: "NLFTHAND", description: "No Use of Left Hand", active: true },
    { id: "104", code: "NLIFTING", description: "No Lifting", active: true },
    { id: "105", code: "NOFORKLIFT", description: "Do Not Operate Forklift", active: true },
    { id: "106", code: "NOSHIFT", description: "No Shift Work", active: true },
    { id: "107", code: "NOSHIFTROT", description: "No Rotating Shifts", active: true },
    { id: "108", code: "NOSQUAT", description: "No Squatting", active: true },
    { id: "109", code: "NOSTNDDEFI", description: "No Standing More Than Defined Hours Per Day", active: true },
    { id: "110", code: "NOVERHEAD", description: "No Overhead Work", active: true },
    { id: "111", code: "NPP", description: "No Pushing / Pulling", active: true },
    { id: "112", code: "NR", description: "No Reaching", active: true },
    { id: "113", code: "NRASHOULD", description: "No Reaching Above Shoulder Level", active: true },
    { id: "114", code: "NRASL", description: "No Reaching Above Shoulder Level", active: true },
    { id: "115", code: "NRBSOC", description: "No Repetitive Bending Stooping Or Crouching", active: true },
    { id: "116", code: "NRGTHAND", description: "No Use of right hand", active: true },
    { id: "117", code: "NRIGHTARM", description: "No Use of Right Arm", active: true },
    { id: "118", code: "NSITTING", description: "No Sitting More Than Defined Hours Per Day", active: true },
    { id: "119", code: "NSTANDING", description: "No Standing", active: true },
    { id: "120", code: "NWBWAIST", description: "No Work Below The Waist", active: true },
    { id: "121", code: "NWOVHEAD", description: "No Working Overhead", active: true },
    { id: "122", code: "OFIELDTEST", description: "Other Field Test - Refer To Other Comments", active: true },
    { id: "123", code: "OTHER", description: "Other Restriction-Not defined in Table", active: true },
    { id: "124", code: "OVERTIMENO", description: "No Overtime", active: true },
    { id: "125", code: "PACE-DEFIB", description: "Implanted Pacemaker/defibrillator restrictions", active: true },
    { id: "126", code: "ReducedHRS", description: "Reduced Working Hours", active: true },
    { id: "127", code: "RESPMSTWR", description: "Must Wear Respirator", active: true },
    { id: "128", code: "REST", description: "Frequent Rests or Breaks", active: true },
    { id: "129", code: "SEDENTARY", description: "Sedentary Work Only", active: true },
    { id: "130", code: "SPLINT", description: "Must Wear Splint", active: true },
    { id: "131", code: "SPLNTBRC", description: "Must Wear Splint/Brace", active: true },
    { id: "132", code: "UNABLECV19MASK", description: "Unable to wear COVID-19 protective mask", active: true },
    { id: "133", code: "WAISTLEVEL", description: "Work At Waist Level", active: true },
    { id: "134", code: "WKBYEMERGY", description: "Do Not Work Over 30 Min From Emergency Facility", active: true },
    { id: "135", code: "WPROTGLASS", description: "Must Wear Protective Glasses or Goggles", active: true },
    { id: "136", code: "WrkCOND", description: "Work Conditioning", active: true },
    { id: "137", code: "Wrk-Home", description: "Work From Home", active: true },
  ],
  caseActivity: [
    { id: "1", code: "2NDMD", description: "2nd MD Referral", active: true },
    { id: "2", code: "ADA Conversation", description: "ADA Conversation", active: true },
    { id: "3", code: "BENCOOR", description: "Benefit Coordination", active: true },
    { id: "4", code: "CASEREV", description: "Case Review", active: true },
    { id: "5", code: "CASESETUP", description: "STD Case Setup", active: true },
    { id: "6", code: "CONSAXIOM", description: "Consult with Axiom", active: true },
    { id: "7", code: "CONSULTBENEFITS", description: "Consult with Benefits", active: true },
    { id: "8", code: "CONSULTFCM", description: "Consult with Field Case Manager", active: true },
    { id: "9", code: "CONSULTPAYROLL", description: "Consult with Payroll", active: true },
    { id: "10", code: "CWADMIN", description: "Consult with Leave of Absence Associate", active: true },
    { id: "11", code: "CWBENDIR", description: "Consult with Director/Leader of Benefits", active: true },
    { id: "12", code: "CWDCM", description: "Consult with Medical Case Manager", active: true },
    { id: "13", code: "CWDISLEADR", description: "Consult with Leave of Absence Lead", active: true },
    { id: "14", code: "CWEAP", description: "Consult with EAP", active: true },
    { id: "15", code: "CWEE", description: "Consult with Employee", active: true },
    { id: "16", code: "CWEEFAM", description: "Consult with Employee's Family", active: true },
    { id: "17", code: "CWFMLAADMIN", description: "Consult with FMLA Administrator", active: true },
    { id: "18", code: "CWHCPROV", description: "Consult with Healthcare Provider", active: true },
    { id: "19", code: "CWHR", description: "Consult with Plant HR", active: true },
    { id: "20", code: "CWLEGAL", description: "Consult with Legal Counsel", active: true },
    { id: "21", code: "CWMEDDIR", description: "Consult with Medical Director", active: true },
    { id: "22", code: "CWOHN", description: "Consult with OHN", active: true },
    { id: "23", code: "CWOTHER", description: "Call (Other)", active: true },
    { id: "24", code: "CWPLANT", description: "Consult with Plant Personnel", active: true },
    { id: "25", code: "CWPROCMGR", description: "Consult with Leave of Absence Specialist", active: true },
    { id: "26", code: "CWPSYCTHER", description: "Consult with Psychiatrist / Therapist", active: true },
    { id: "27", code: "CWPTOT", description: "Consult with PT/OT Provider", active: true },
    { id: "28", code: "CWSAFETY", description: "Consult with Safety", active: true },
    { id: "29", code: "CWSPVRMGR", description: "Consult With Supervisor/Manager", active: true },
    { id: "30", code: "CWUNION", description: "Consult with Union Representative", active: true },
    { id: "31", code: "CWVOCSPEC", description: "Consult With Vocational Specialist", active: true },
    { id: "32", code: "CWWCMGR", description: "Consult with WC Manager", active: true },
    { id: "33", code: "CWWCREP", description: "Consult with WC Claims Administrator", active: true },
    { id: "34", code: "CWWELL", description: "Consult with Wellness", active: true },
    { id: "35", code: "DEPOHRNG", description: "Deposition / Hearing", active: true },
    { id: "36", code: "DEVREHABPL", description: "Develop / Review Rehab Plan", active: true },
    { id: "37", code: "DEVWRKPLAN", description: "Develop / Review Work Plan", active: true },
    { id: "38", code: "Diagnostic Research", description: "Diagnostic Research", active: true },
    { id: "39", code: "EMLTRFAX", description: "Send / receive e-mail, letter, fax, text", active: true },
    { id: "40", code: "EOMREVIEW", description: "Monthly Review", active: true },
    { id: "41", code: "FAXCONFIRM", description: "Fax Confirmation", active: true },
    { id: "42", code: "FILE Plan", description: "Case Plan of Action", active: true },
    { id: "43", code: "FMLA Approval", description: "FMLA leave approved", active: true },
    { id: "44", code: "FMLA Benefit", description: "FMLA Benefit Coordination", active: true },
    { id: "45", code: "FMLA Deny", description: "FMLA leave denied", active: true },
    { id: "46", code: "FMLA forms", description: "FMLA forms provided / sent to employee", active: true },
    { id: "47", code: "FMLA Notification", description: "FMLA Notification", active: true },
    { id: "48", code: "FMLA Request", description: "FMLA Requested by employee", active: true },
    { id: "49", code: "FMLAEXHAUST", description: "FMLA Exhausted", active: true },
    { id: "50", code: "IMEREFERAL", description: "IME Referral", active: true },
    { id: "51", code: "IMEREPORT", description: "IME Report", active: true },
    { id: "52", code: "INITASSESS", description: "Initial Assessment", active: true },
    { id: "53", code: "INVOICEPAY", description: "Invoice Payment", active: true },
    { id: "54", code: "INVOICEVEND", description: "Vendor Invoice", active: true },
    { id: "55", code: "JOBANALYS", description: "Job Analysis", active: true },
    { id: "56", code: "JOBDESCRIPTION", description: "Job Description", active: true },
    { id: "57", code: "LTDAPPLICATION", description: "LTD Application", active: true },
    { id: "58", code: "LTDAPPREMINDER", description: "LTD Application Reminder", active: true },
    { id: "59", code: "LTDAPPSUBMISSION", description: "LTD App Submission", active: true },
    { id: "60", code: "LTDFILEREVIEW", description: "LTD File Review", active: true },
    { id: "61", code: "MDA", description: "Disability Duration Review", active: true },
    { id: "62", code: "PERM", description: "Permanent Restrictions Meeting / Discussion", active: true },
    { id: "63", code: "REASSESS1", description: "Monthly Reassessment - 1 mo", active: true },
    { id: "64", code: "REASSESS10", description: "Monthly Reassessment - 10 mo", active: true },
    { id: "65", code: "REASSESS11", description: "Monthly Reassessment - 11 mo", active: true },
    { id: "66", code: "REASSESS12", description: "Monthly Reassessment - 12 mo", active: true },
    { id: "67", code: "REASSESS13", description: "Monthly Reassessment - 13 mo", active: true },
    { id: "68", code: "REASSESS14", description: "Monthly Reassessment - 14 mo", active: true },
    { id: "69", code: "REASSESS15", description: "Monthly Reassessment - 15 mo", active: true },
    { id: "70", code: "REASSESS16", description: "Monthly Reassessment - 16 mo", active: true },
    { id: "71", code: "REASSESS17", description: "Monthly Reassessment - 17 mo", active: true },
    { id: "72", code: "REASSESS2", description: "Monthly Reassessment - 2 mo", active: true },
    { id: "73", code: "REASSESS3", description: "Monthly Reassessment  -3 mo", active: true },
    { id: "74", code: "REASSESS4", description: "Monthly Reassessment - 4 mo", active: true },
    { id: "75", code: "REASSESS5", description: "Monthly Reassessment - 5 mo", active: true },
    { id: "76", code: "REASSESS6", description: "Monthly Reassessment - 6 mo", active: true },
    { id: "77", code: "REASSESS7", description: "Monthly Reassessment - 7 mo", active: true },
    { id: "78", code: "REASSESS8", description: "Monthly Reassessment - 8 mo", active: true },
    { id: "79", code: "REASSESS9", description: "Monthly Reassessment - 9 mo", active: true },
    { id: "80", code: "REMINDNLT", description: "Reminder that this case is open", active: true },
    { id: "81", code: "RESTREVIEW", description: "Restrictions Review", active: true },
    { id: "82", code: "REVIEWLEGALDOCS", description: "Review Legal Documents", active: true },
    { id: "83", code: "REVMEDREC", description: "Review Medical Records", active: true },
    { id: "84", code: "REVMISCITEM", description: "Review of Misc. Item", active: true },
    { id: "85", code: "RREHABRPT", description: "Review Rehab Reports", active: true },
    { id: "86", code: "SSDIAPP", description: "SSDI Referral / Application", active: true },
    { id: "87", code: "SSDIUPDATE", description: "SSDI Update", active: true },
    { id: "88", code: "STDNOTIFICATION", description: "STD Notification", active: true },
    { id: "89", code: "VOCREFEERRAL", description: "Vocational Referral", active: true },
    { id: "90", code: "VOCREPORT", description: "Vocational Report", active: true },
    { id: "91", code: "WC Denied", description: "WC Denied - STD approved", active: true },
    { id: "92", code: "WCCLOSURE", description: "Work Comp Closure", active: true },
    { id: "93", code: "WELLdiscu", description: "Wellness Discussion / Referral", active: true },
    { id: "94", code: "WTBOEST", description: "WTBO estimate", active: true },
  ],
  documentType: [
    { id: "1", code: "Audio - DECL", description: "Audio - DECLINATION", active: true },
    { id: "2", code: "AUDIOGRAM", description: "Audiometric Test data", active: true },
    { id: "3", code: "AUDIOSUMMARY", description: "Individual Audiometric Record (Cumulative)", active: true },
    { id: "4", code: "AUTHORIZATION", description: "Authorization for Disclosure of PHI", active: true },
    { id: "5", code: "BBP ACC/DECLINE", description: "BBP Vaccine & Hep B Surface Antibody Accpt/Decl", active: true },
    { id: "6", code: "CM-A2K Invoice", description: "Advantage 2000 Billing / Invoice", active: true },
    { id: "7", code: "CM-ACTIVEHLTH", description: "Active Health Referral Form", active: true },
    { id: "8", code: "CM-Appeal", description: "STD - LTD Benefit Appeal Letters", active: true },
    { id: "9", code: "CM-CA State SDI", description: "CA State Form for SDI", active: true },
    { id: "10", code: "CM-CONSENT", description: "OC Consent & Release Document", active: true },
    { id: "11", code: "CM-DDR", description: "Duty Disposition Report", active: true },
    { id: "12", code: "CM-DR Office note", description: "Dr Office Notes / Visit Information", active: true },
    { id: "13", code: "CM-FAXConf", description: "Fax Confirmation", active: true },
    { id: "14", code: "CM-FAX-email", description: "Faxed Documents or e-mail document", active: true },
    { id: "15", code: "CM-FCE", description: "Functional Capacity Evaluation Medical Report", active: true },
    { id: "16", code: "CM-FMLA Appl", description: "FMLA Medical Certification", active: true },
    { id: "17", code: "CM-IME", description: "Independant Medical Evaluation Medical Records", active: true },
    { id: "18", code: "CM-INVOICE", description: "Invoice", active: true },
    { id: "19", code: "CM-JOB ANALYSIS", description: "Job Analysis", active: true },
    { id: "20", code: "CM-JOBDESC", description: "Job Description", active: true },
    { id: "21", code: "CM-LAB", description: "Lab Report", active: true },
    { id: "22", code: "CM-Legal Docs", description: "Legal Documents", active: true },
    { id: "23", code: "CM-LETTER", description: "Letter", active: true },
    { id: "24", code: "CM-LTD Application", description: "LTD Application Forms", active: true },
    { id: "25", code: "CM-LTD Benefit ltr", description: "LTD Letter Explaining Owens Corning Benefits", active: true },
    { id: "26", code: "CM-LTD Claim Init", description: "LTD Claim Initiation Letter", active: true },
    { id: "27", code: "CM-LTD Decision", description: "LTD Decision Letter", active: true },
    { id: "28", code: "CM-LTD ERISA Ext", description: "LTD ERISA 30-day extension letter", active: true },
    { id: "29", code: "CM-LTD Notif", description: "LTD Approval or Denial Notification Form", active: true },
    { id: "30", code: "CM-MDA-Predic", description: "MDA - Predictive Documentation", active: true },
    { id: "31", code: "CM-MEDICALRECORDS", description: "Medical Records", active: true },
    { id: "32", code: "CM-MEDICATIONS", description: "List of current medications for employee", active: true },
    { id: "33", code: "CM-NJ STATE SDI", description: "New Jersey State Disability", active: true },
    { id: "34", code: "CM-OFFSET", description: "Offset", active: true },
    { id: "35", code: "CM-ORDERS", description: "Orders", active: true },
    { id: "36", code: "CM-OTHER", description: "Miscellaneous reports or information", active: true },
    { id: "37", code: "CM-PHOTO", description: "Photograph", active: true },
    { id: "38", code: "CM-PHYSTHER", description: "Physical Therapy Report", active: true },
    { id: "39", code: "CM-REDACTED MEDICAL", description: "Redacted Medical", active: true },
    { id: "40", code: "CM-REIMBURSEInfo", description: "Reimbursement Information", active: true },
    { id: "41", code: "CM-RELEASE", description: "Release of Information", active: true },
    { id: "42", code: "CM-REPAYAGR", description: "Repayment Agreement", active: true },
    { id: "43", code: "CM-RESTRICTED WORK", description: "Restricted Work Form", active: true },
    { id: "44", code: "CM-RTW Auth", description: "RTW slip/authorization", active: true },
    { id: "45", code: "CM-RX", description: "Prescription", active: true },
    { id: "46", code: "CM-SSDI Award LTR", description: "Social Security Disability Insurance Award letter", active: true },
    { id: "47", code: "CM-SSDI Denial", description: "Social Security Disability Insurance Denial", active: true },
    { id: "48", code: "CM-STATEAPPR", description: "State Disability Benefit Approval", active: true },
    { id: "49", code: "CM-STATECALC", description: "State Disability Calculation", active: true },
    { id: "50", code: "CM-STDApplic", description: "STD Application Document", active: true },
    { id: "51", code: "CM-STD-FMLA", description: "STD and /or FMLA Notifications", active: true },
    { id: "52", code: "CM-TB", description: "TB Test data", active: true },
    { id: "53", code: "CM-Test Results", description: "Test Results", active: true },
    { id: "54", code: "CM-VOC EVAL", description: "Vocational Evaluation", active: true },
    { id: "55", code: "CM-VOICEMAIL", description: "Voicemail Message", active: true },
    { id: "56", code: "CM-WAGES", description: "Pay History Documents / Wage Documents", active: true },
    { id: "57", code: "CM-WC AUTH", description: "WC Authorization for Medical - Diagnostics", active: true },
    { id: "58", code: "CM-WC LWDappr", description: "WC Approval for Employee Time Off Work Form", active: true },
    { id: "59", code: "CM-WC MD Rating", description: "Workers Compensation Medical Doctor Rating", active: true },
    { id: "60", code: "CM-WC MISC DOC", description: "Miscellaneous WC Documents", active: true },
    { id: "61", code: "CM-WC OPEN MED", description: "WC Open Medical Report", active: true },
    { id: "62", code: "CM-WCAUTHORZA", description: "WC Authorization for Treatment Form", active: true },
    { id: "63", code: "CM-WCDecision", description: "WC Decision of WCBoard", active: true },
    { id: "64", code: "CM-WCHearing", description: "WC Hearing and/or Court Appearance", active: true },
    { id: "65", code: "CM-Work Cond", description: "Work Conditioning / Hardening", active: true },
    { id: "66", code: "CM-WRKStatus", description: "Work Status Report", active: true },
    { id: "67", code: "CM-WTBO Emp", description: "WTBO Benefit Documents sent to Employee", active: true },
    { id: "68", code: "CM-WTBO Final", description: "WTBO Final documents", active: true },
    { id: "69", code: "CM-WTBO Payment", description: "WTBO Payment Detail Documentation", active: true },
    { id: "70", code: "CM-XRAY", description: "X-Ray", active: true },
    { id: "71", code: "CM-XRAY-REPORT", description: "Xray report", active: true },
  ],
}

const initialCaseManagers: CaseManager[] = [
  { id: "1", name: "Arlene Rosario, CPDM", active: true },
  { id: "2", name: "Debbie Swann, RN, CCM", active: true },
  { id: "3", name: "Kate Gilligan, BSN, RN, CCM", active: true },
  { id: "4", name: "Mariana Diaz, BA, CPDM", active: true },
  { id: "5", name: "Nicole Kunde, CPDM", active: true },
  { id: "6", name: "Nicole Milburn, RN, CCM", active: true },
  { id: "7", name: "Sean Beaber, RN", active: true },
  { id: "8", name: "Sheila Roy, RN, BSN, COHN-S", active: true },
  { id: "9", name: "Stacey Burton, M.ED, CRC, CDMS", active: true },
  { id: "10", name: "Stacey Hartman, MS, CCM", active: true },
]

export function AdminProvider({ children }: { children: ReactNode }) {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(initialCaseTypes)
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>(initialCaseManagers)
  const [codes, setCodes] = useState<CodeTables>(initialCodeTables)

  const addCaseType = (caseType: Omit<CaseType, "id">) => {
    const newCaseType: CaseType = {
      id: Date.now().toString(),
      confidential: false, // Default confidential value
      ...caseType,
    }
    setCaseTypes((prev) => [...prev, newCaseType])
  }

  const updateCaseType = (id: string, updates: Partial<Omit<CaseType, "id">>) => {
    setCaseTypes((prev) => prev.map((ct) => (ct.id === id ? { ...ct, ...updates } : ct)))
  }

  const deleteCaseType = (id: string) => {
    setCaseTypes((prev) => prev.filter((ct) => ct.id !== id))
  }

  const getCaseType = (name: string) => {
    return caseTypes.find((ct) => ct.name === name)
  }

  const addCaseManager = (caseManager: Omit<CaseManager, "id">) => {
    const newCaseManager: CaseManager = {
      id: Date.now().toString(),
      ...caseManager,
    }
    setCaseManagers((prev) => [...prev, newCaseManager])
  }

  const updateCaseManager = (id: string, updates: Partial<Omit<CaseManager, "id">>) => {
    setCaseManagers((prev) => prev.map((cm) => (cm.id === id ? { ...cm, ...updates } : cm)))
  }

  const deleteCaseManager = (id: string) => {
    setCaseManagers((prev) => prev.filter((cm) => cm.id !== id))
  }

  const addCode = (table: keyof CodeTables, code: Omit<Code, "id">) => {
    const newCode: Code = {
      id: Date.now().toString(),
      ...code,
    }
    setCodes((prev) => ({
      ...prev,
      [table]: [...prev[table], newCode],
    }))
  }

  const updateCode = (table: keyof CodeTables, id: string, updates: Partial<Omit<Code, "id">>) => {
    setCodes((prev) => ({
      ...prev,
      [table]: prev[table].map((code) => (code.id === id ? { ...code, ...updates } : code)),
    }))
  }

  const deleteCode = (table: keyof CodeTables, id: string) => {
    setCodes((prev) => ({
      ...prev,
      [table]: prev[table].filter((code) => code.id !== id),
    }))
  }

  return (
    <AdminContext.Provider
      value={{
        caseTypes,
        addCaseType,
        updateCaseType,
        deleteCaseType,
        getCaseType,
        caseManagers,
        addCaseManager,
        updateCaseManager,
        deleteCaseManager,
        codes,
        addCode,
        updateCode,
        deleteCode,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}

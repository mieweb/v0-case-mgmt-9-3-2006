export const caseTypeMap: Record<string, string> = {
  mat: "MAT — Maternity",
  mhsa: "MHSA — Mental Health Substance Abuse",
  nlt: "NLT — No Lost Time Non-Occupational",
  non: "NON — Non-occupational injury / illness",
  occ: "OCC — Occupational injury / illness",
  // Legacy mappings for backwards compatibility
  MAT: "MAT — Maternity",
  MHSA: "MHSA — Mental Health Substance Abuse",
  NLT: "NLT — No Lost Time Non-Occupational",
  NON: "NON — Non-occupational injury / illness",
  OCC: "OCC — Occupational injury / illness",
}

export function getCaseTypeDescription(code: string): string {
  return caseTypeMap[code.toLowerCase()] || caseTypeMap[code] || code
}

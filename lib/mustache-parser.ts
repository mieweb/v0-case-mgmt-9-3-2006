import type { Case } from "@/contexts/cases-context"

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

export function evaluateMustacheTemplate(template: string, caseData: Case): string {
  let result = template

  // Parse employee name into first and last name
  const nameParts = (caseData.employeeName || "").split(" ")
  const employeeFirstName = nameParts[0] || ""
  const employeeLastName = nameParts.slice(1).join(" ") || ""

  // Parse address into components (assuming format: "Street, City, State ZIP" or similar)
  const addressParts = (caseData.address || "").split(",").map(s => s.trim())
  const employeeStreet1 = addressParts[0] || ""
  const employeeStreet2 = "" // Can be extended if address format supports it
  const cityStateZip = addressParts[1] || ""
  const cityStateZipMatch = cityStateZip.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)
  const employeeCity = cityStateZipMatch ? cityStateZipMatch[1] : cityStateZip
  const employeeState = cityStateZipMatch ? cityStateZipMatch[2] : ""
  const employeeZip = cityStateZipMatch ? cityStateZipMatch[3] : ""

  // Create a context object with all case data
  const context: Record<string, any> = {
    // Employee Info
    employeeName: caseData.employeeName || "",
    employeeFirstName,
    employeeLastName,
    employeeNumber: caseData.employeeNumber || "",
    employeeSSN: caseData.employeeSSN || "",
    employeeLocation: caseData.employeeLocation || "",
    employeeClass: caseData.employeeClass || "",
    employeeEthnicGroup: caseData.employeeEthnicGroup || "",
    dateOfBirth: caseData.dateOfBirth || "",
    dateOfHire: caseData.dateOfHire || "",
    address: caseData.address || "",
    employeeStreet1,
    employeeStreet2,
    employeeCity,
    employeeState,
    employeeZip,
    age: caseData.age || "",
    employmentType: caseData.employmentType || "",
    cellPhone: caseData.cellPhone || "",
    homePhone: caseData.homePhone || "",
    personalEmail: caseData.personalEmail || "",
    gender: caseData.gender || "",
    position: caseData.position || "",

    // Case Info
    caseNumber: caseData.caseNumber || "",
    caseType: caseData.caseType || "",
    caseCategory: caseData.caseCategory || "",
    caseManager: caseData.caseManager || "",
    caseManagerPhone: caseData.caseManagerPhone || "",
    caseManagerWithCredentials: caseData.caseManager || "",
    status: caseData.status || "",
    dateOfDisability: caseData.dateOfDisability || "",
    initialContactDate: caseData.initialContactDate || "",
    dateClosed: caseData.dateClosed || "",
    closureReason: caseData.closureReason || "",
    
    // Medical Info
    diagnosis: caseData.diagnosis || "",
    natureOfInjury: caseData.natureOfInjury || "",

    // Adjuster Info - lookup name from code, fallback to stored values
    adjuster: caseData.adjuster ? (adjusterData[caseData.adjuster]?.name || caseData.adjuster) : "",
    adjusterPhone: caseData.adjusterPhone || (caseData.adjuster ? adjusterData[caseData.adjuster]?.phone : "") || "",
    adjusterEmail: caseData.adjusterEmail || (caseData.adjuster ? adjusterData[caseData.adjuster]?.email : "") || "",

    // Dates
    stdStartDate: caseData.stdStartDate || "",
    expectedReturnDate: caseData.expectedReturnDate || "",
    actualReturnDate: caseData.actualReturnDate || "",
    deliveryDate: caseData.deliveryDate || "",

    // Current date
    today: new Date().toLocaleDateString(),
    currentYear: new Date().getFullYear(),
  }

  // Replace {{key}} or {{category.key}} with values from context
  result = result.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, key) => {
    // Handle dot notation like {{case.adjuster}} - extract just the key part
    const actualKey = key.includes('.') ? key.split('.').pop() : key
    return context[actualKey] !== undefined ? String(context[actualKey]) : match
  })

  return result
}

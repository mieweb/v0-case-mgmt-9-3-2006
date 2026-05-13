import { NextRequest, NextResponse } from "next/server"

// Cache for WHO API token
let cachedToken: { token: string; expiresAt: number } | null = null

// ICD-11 to ICD-10 crosswalk mapping (maintained for auto-translation)
const ICD11_TO_ICD10_MAP: Record<string, { code: string; description: string }> = {
  // This is a simplified crosswalk - the WHO provides a full mapping tool
  // Common musculoskeletal
  "FA70": { code: "S13-S93", description: "Sprain and strain" },
  "FB40": { code: "M47", description: "Spondylosis" },
  "FB50": { code: "M19", description: "Osteoarthritis" },
  "FB80": { code: "M54.5", description: "Low back pain" },
  "FB81": { code: "M54.2", description: "Cervicalgia" },
  "FB82": { code: "M54.1", description: "Radiculopathy" },
  "FB83": { code: "M54.3", description: "Sciatica" },
  
  // Mental health
  "6A70": { code: "F32", description: "Major depressive disorder, single episode" },
  "6A71": { code: "F33", description: "Major depressive disorder, recurrent" },
  "6A80": { code: "F41.1", description: "Generalized anxiety disorder" },
  "6B00": { code: "F43.1", description: "Post-traumatic stress disorder" },
  "6B20": { code: "F43.2", description: "Adjustment disorders" },
  
  // Cardiovascular
  "BA01": { code: "I10", description: "Essential hypertension" },
  "BA41": { code: "I21", description: "Acute myocardial infarction" },
  "BA80": { code: "I50", description: "Heart failure" },
  "BB01": { code: "I48", description: "Atrial fibrillation" },
  
  // Respiratory
  "CA40": { code: "J44", description: "COPD" },
  "CA80": { code: "J45", description: "Asthma" },
  
  // Endocrine
  "5A10": { code: "E10", description: "Type 1 diabetes mellitus" },
  "5A11": { code: "E11", description: "Type 2 diabetes mellitus" },
  
  // Neurological
  "8A00": { code: "G40", description: "Epilepsy" },
  "8A20": { code: "G43", description: "Migraine" },
  "8A40": { code: "G35", description: "Multiple sclerosis" },
  "8A60": { code: "G20", description: "Parkinson's disease" },
  "MB40": { code: "G89", description: "Chronic pain" },
  "MB41": { code: "M79.7", description: "Fibromyalgia" },
}

// Function to get WHO API OAuth token
async function getWHOToken(): Promise<string | null> {
  const clientId = process.env.WHO_ICD_CLIENT_ID
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  try {
    const tokenEndpoint = "https://icdaccessmanagement.who.int/connect/token"
    
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "icdapi_access",
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      console.error("Failed to get WHO API token:", response.status)
      return null
    }

    const data = await response.json()
    
    // Cache the token (expires in ~1 hour, we'll refresh 5 minutes early)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error("Error getting WHO API token:", error)
    return null
  }
}

// Function to search WHO ICD-11 API
async function searchWHOICD11(query: string, token: string): Promise<any[]> {
  try {
    // Search the ICD-11 MMS (Mortality and Morbidity Statistics) linearization
    const searchUrl = `https://id.who.int/icd/release/11/2023-01/mms/search?q=${encodeURIComponent(query)}&useFlexisearch=true&flatResults=true`
    
    const response = await fetch(searchUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Accept-Language": "en",
        "API-Version": "v2",
      },
    })

    if (!response.ok) {
      console.error("WHO ICD-11 search failed:", response.status)
      return []
    }

    const data = await response.json()
    
    // Transform WHO API response to our format
    const results = (data.destinationEntities || []).slice(0, 20).map((entity: any) => {
      // Extract the code from the entity
      const code = entity.theCode || extractCodeFromTitle(entity.title) || ""
      const description = cleanTitle(entity.title || entity.label || "")
      
      // Look up ICD-10 mapping
      const icd10Match = findICD10Mapping(code)
      
      return {
        code,
        description,
        icd10Code: icd10Match?.code || "",
        icd10Description: icd10Match?.description || "",
        foundationUri: entity.foundationUri || "",
        linearizationUri: entity.id || "",
      }
    }).filter((r: any) => r.code && r.description)

    return results
  } catch (error) {
    console.error("Error searching WHO ICD-11:", error)
    return []
  }
}

// Helper to extract code from title like "BA01 Essential hypertension"
function extractCodeFromTitle(title: string): string {
  if (!title) return ""
  // Match ICD-11 code pattern at the beginning
  const match = title.match(/^([A-Z0-9]{2,}(?:\.[A-Z0-9]+)*)\s/)
  return match ? match[1] : ""
}

// Helper to clean title by removing the code prefix
function cleanTitle(title: string): string {
  if (!title) return ""
  // Remove highlighting tags
  let clean = title.replace(/<[^>]+>/g, "")
  // Remove code prefix if present
  clean = clean.replace(/^[A-Z0-9]{2,}(?:\.[A-Z0-9]+)*\s+/, "")
  return clean.trim()
}

// Helper to find ICD-10 mapping (tries exact match first, then prefix match)
function findICD10Mapping(icd11Code: string): { code: string; description: string } | null {
  if (!icd11Code) return null
  
  // Try exact match
  if (ICD11_TO_ICD10_MAP[icd11Code]) {
    return ICD11_TO_ICD10_MAP[icd11Code]
  }
  
  // Try prefix match (e.g., "FA70.1" might match "FA70")
  const baseCode = icd11Code.split(".")[0]
  if (ICD11_TO_ICD10_MAP[baseCode]) {
    return ICD11_TO_ICD10_MAP[baseCode]
  }
  
  return null
}

// Fallback local database for when WHO API is not configured
const FALLBACK_ICD11_CODES: { code: string; description: string }[] = [
  // Musculoskeletal disorders
  { code: "FA20", description: "Fracture of bone" },
  { code: "FA24.0", description: "Fracture of cervical vertebra" },
  { code: "FA24.1", description: "Fracture of thoracic vertebra" },
  { code: "FA24.2", description: "Fracture of lumbar vertebra" },
  { code: "FA70", description: "Sprain or strain of joint or ligament" },
  { code: "FA70.0", description: "Sprain of cervical spine" },
  { code: "FA70.1", description: "Sprain of lumbar spine" },
  { code: "FA72", description: "Strain of muscle or tendon" },
  { code: "FB40", description: "Degenerative condition of spine" },
  { code: "FB40.0", description: "Cervical disc degeneration" },
  { code: "FB40.1", description: "Thoracic disc degeneration" },
  { code: "FB40.2", description: "Lumbar disc degeneration" },
  { code: "FB41", description: "Spondylosis" },
  { code: "FB42", description: "Intervertebral disc disorders" },
  { code: "FB50", description: "Osteoarthritis of joint" },
  { code: "FB50.0", description: "Osteoarthritis of hip" },
  { code: "FB50.1", description: "Osteoarthritis of knee" },
  { code: "FB51", description: "Rheumatoid arthritis" },
  { code: "FB54", description: "Gout" },
  { code: "FB70", description: "Soft tissue disorders" },
  { code: "FB71", description: "Bursitis" },
  { code: "FB72", description: "Tendinitis" },
  { code: "FB73", description: "Carpal tunnel syndrome" },
  { code: "FB80", description: "Low back pain" },
  { code: "FB81", description: "Neck pain" },
  { code: "FB82", description: "Radiculopathy" },
  { code: "FB83", description: "Sciatica" },
  
  // Mental and behavioral disorders
  { code: "6A70", description: "Single episode depressive disorder" },
  { code: "6A71", description: "Recurrent depressive disorder" },
  { code: "6A72", description: "Dysthymic disorder" },
  { code: "6A80", description: "Generalised anxiety disorder" },
  { code: "6A81", description: "Panic disorder" },
  { code: "6B00", description: "Post traumatic stress disorder" },
  { code: "6B20", description: "Adjustment disorder" },
  { code: "6B40", description: "Obsessive-compulsive disorder" },
  { code: "6C40", description: "Alcohol dependence" },
  { code: "6C41", description: "Opioid dependence" },
  { code: "6D10", description: "Personality disorder" },
  { code: "6D70", description: "Neurocognitive disorders" },
  { code: "QD80", description: "Burnout" },
  
  // Cardiovascular conditions
  { code: "BA00", description: "Hypertensive heart disease" },
  { code: "BA01", description: "Essential hypertension" },
  { code: "BA40", description: "Ischaemic heart disease" },
  { code: "BA41", description: "Acute myocardial infarction" },
  { code: "BA42", description: "Chronic ischaemic heart disease" },
  { code: "BA43", description: "Angina pectoris" },
  { code: "BA80", description: "Heart failure" },
  { code: "BA81", description: "Cardiomyopathy" },
  { code: "BB00", description: "Cardiac arrhythmia" },
  { code: "BB01", description: "Atrial fibrillation or flutter" },
  { code: "BD10", description: "Cerebrovascular disease" },
  { code: "BD11", description: "Stroke" },
  
  // Respiratory conditions
  { code: "CA20", description: "Pneumonia" },
  { code: "CA21", description: "Bronchitis" },
  { code: "CA22", description: "Acute bronchitis" },
  { code: "CA23", description: "Chronic bronchitis" },
  { code: "CA40", description: "Chronic obstructive pulmonary disease" },
  { code: "CA80", description: "Asthma" },
  { code: "CB00", description: "Pulmonary fibrosis" },
  { code: "CB01", description: "Respiratory failure" },
  
  // Neoplasms
  { code: "2B60", description: "Malignant neoplasm of breast" },
  { code: "2B70", description: "Malignant neoplasm of bronchus or lung" },
  { code: "2B90", description: "Malignant neoplasm of colon" },
  { code: "2C00", description: "Malignant neoplasm of prostate" },
  { code: "2C80", description: "Malignant neoplasm of skin" },
  { code: "2D00", description: "Benign neoplasm" },
  { code: "2E00", description: "Neoplasm of uncertain behaviour" },
  
  // Neurological conditions
  { code: "8A00", description: "Epilepsy" },
  { code: "8A20", description: "Migraine" },
  { code: "8A21", description: "Tension-type headache" },
  { code: "8A40", description: "Multiple sclerosis" },
  { code: "8A60", description: "Parkinson disease" },
  { code: "8B00", description: "Peripheral neuropathy" },
  { code: "8B20", description: "Trigeminal neuralgia" },
  { code: "8B60", description: "Myasthenia gravis" },
  { code: "8D00", description: "Alzheimer disease" },
  { code: "MB40", description: "Chronic pain" },
  { code: "MB41", description: "Fibromyalgia" },
  
  // Digestive disorders
  { code: "DA40", description: "Gastritis" },
  { code: "DA41", description: "Gastric ulcer" },
  { code: "DA42", description: "Duodenal ulcer" },
  { code: "DA90", description: "Irritable bowel syndrome" },
  { code: "DA91", description: "Inflammatory bowel disease" },
  { code: "DA92", description: "Crohn disease" },
  { code: "DA93", description: "Ulcerative colitis" },
  { code: "DB10", description: "Cirrhosis of liver" },
  { code: "DB30", description: "Pancreatitis" },
  { code: "DB70", description: "Gallbladder disease" },
  { code: "ME80", description: "Hernia" },
  
  // Endocrine disorders
  { code: "5A10", description: "Type 1 diabetes mellitus" },
  { code: "5A11", description: "Type 2 diabetes mellitus" },
  { code: "5A20", description: "Hyperthyroidism" },
  { code: "5A21", description: "Hypothyroidism" },
  { code: "5B80", description: "Obesity" },
  { code: "5C50", description: "Adrenal insufficiency" },
  
  // Genitourinary disorders
  { code: "GB40", description: "Acute kidney injury" },
  { code: "GB60", description: "Chronic kidney disease" },
  { code: "GB90", description: "Kidney stones" },
  { code: "GC00", description: "Urinary tract infection" },
  { code: "GC10", description: "Cystitis" },
  { code: "GA30", description: "Endometriosis" },
  { code: "GA31", description: "Uterine leiomyoma" },
  
  // Infectious diseases
  { code: "1A00", description: "Cholera" },
  { code: "1C00", description: "Tuberculosis" },
  { code: "1E00", description: "Viral hepatitis" },
  { code: "1F00", description: "HIV disease" },
  { code: "1G00", description: "Influenza" },
  { code: "RA01", description: "COVID-19" },
  
  // Injuries
  { code: "NA00", description: "Traumatic brain injury" },
  { code: "NA01", description: "Concussion" },
  { code: "NA70", description: "Spinal cord injury" },
  { code: "NB00", description: "Burn injury" },
  { code: "NC00", description: "Frostbite" },
  { code: "PB00", description: "Transport accident injury" },
  { code: "PD00", description: "Fall injury" },
  { code: "PG00", description: "Occupational injury" },
  
  // Blood disorders
  { code: "3A00", description: "Anaemia" },
  { code: "3A01", description: "Iron deficiency anaemia" },
  { code: "3A70", description: "Coagulation disorders" },
  { code: "3B00", description: "Leukaemia" },
  { code: "3B60", description: "Lymphoma" },
  
  // Skin conditions
  { code: "EA80", description: "Dermatitis" },
  { code: "EA81", description: "Atopic dermatitis" },
  { code: "EA90", description: "Psoriasis" },
  { code: "EB00", description: "Urticaria" },
  { code: "EB40", description: "Acne" },
  
  // Eye and ear conditions
  { code: "9A00", description: "Cataract" },
  { code: "9A40", description: "Glaucoma" },
  { code: "9B00", description: "Retinal disorders" },
  { code: "9B70", description: "Visual impairment" },
  { code: "AA00", description: "Otitis media" },
  { code: "AA40", description: "Hearing loss" },
  { code: "AB00", description: "Disorders of vestibular function" },
  { code: "AB30", description: "Tinnitus" },
]

// Fallback search using local database
function searchFallback(query: string): any[] {
  const searchLower = query.toLowerCase()
  
  return FALLBACK_ICD11_CODES.filter(
    (item) =>
      item.code.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
  ).slice(0, 20).map((item) => {
    const icd10Match = findICD10Mapping(item.code)
    return {
      ...item,
      icd10Code: icd10Match?.code || "",
      icd10Description: icd10Match?.description || "",
    }
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], source: "none" })
  }

  // Try to use WHO API if credentials are configured
  const token = await getWHOToken()
  
  if (token) {
    const results = await searchWHOICD11(query, token)
    if (results.length > 0) {
      return NextResponse.json({ results, source: "who" })
    }
  }

  // Fall back to local database
  const results = searchFallback(query)
  return NextResponse.json({ 
    results, 
    source: "fallback",
    message: token ? "WHO API returned no results, using fallback" : "WHO API not configured, using fallback database. For full ICD-11 catalog, configure WHO_ICD_CLIENT_ID and WHO_ICD_CLIENT_SECRET environment variables."
  })
}

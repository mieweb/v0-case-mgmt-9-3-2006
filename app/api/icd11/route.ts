import { NextRequest, NextResponse } from "next/server"

// ICD-11 to ICD-10 crosswalk mapping
const ICD11_TO_ICD10_MAP: Record<string, { code: string; description: string }> = {
  // Musculoskeletal disorders
  "FA20": { code: "S00-T14", description: "Fracture" },
  "FA24.0": { code: "S12", description: "Fracture of cervical vertebra" },
  "FA24.1": { code: "S22.0", description: "Fracture of thoracic vertebra" },
  "FA24.2": { code: "S32.0", description: "Fracture of lumbar vertebra" },
  "FA70": { code: "S13-S93", description: "Sprain and strain" },
  "FA70.0": { code: "S13.4", description: "Sprain of ligaments of cervical spine" },
  "FA70.1": { code: "S33.5", description: "Sprain of ligaments of lumbar spine" },
  "FA72": { code: "S46-S96", description: "Strain of muscle or tendon" },
  "FB40": { code: "M47", description: "Spondylosis" },
  "FB40.0": { code: "M50.3", description: "Cervical disc degeneration" },
  "FB40.1": { code: "M51.3", description: "Thoracic disc degeneration" },
  "FB40.2": { code: "M51.36", description: "Lumbar disc degeneration" },
  "FB41": { code: "M47.8", description: "Other spondylosis" },
  "FB42": { code: "M51", description: "Thoracic, thoracolumbar, and lumbosacral intervertebral disc disorders" },
  "FB50": { code: "M19", description: "Other and unspecified osteoarthritis" },
  "FB50.0": { code: "M16", description: "Osteoarthritis of hip" },
  "FB50.1": { code: "M17", description: "Osteoarthritis of knee" },
  "FB51": { code: "M06.9", description: "Rheumatoid arthritis, unspecified" },
  "FB54": { code: "M10", description: "Gout" },
  "FB70": { code: "M79", description: "Other and unspecified soft tissue disorders" },
  "FB71": { code: "M71", description: "Other bursopathies" },
  "FB72": { code: "M77", description: "Other enthesopathies" },
  "FB73": { code: "G56.0", description: "Carpal tunnel syndrome" },
  "FB80": { code: "M54.5", description: "Low back pain" },
  "FB81": { code: "M54.2", description: "Cervicalgia" },
  "FB82": { code: "M54.1", description: "Radiculopathy" },
  "FB83": { code: "M54.3", description: "Sciatica" },
  
  // Mental and behavioral disorders
  "6A70": { code: "F32", description: "Major depressive disorder, single episode" },
  "6A71": { code: "F33", description: "Major depressive disorder, recurrent" },
  "6A72": { code: "F34.1", description: "Dysthymic disorder" },
  "6A80": { code: "F41.1", description: "Generalized anxiety disorder" },
  "6A81": { code: "F41.0", description: "Panic disorder" },
  "6B00": { code: "F43.1", description: "Post-traumatic stress disorder" },
  "6B20": { code: "F43.2", description: "Adjustment disorders" },
  "6B40": { code: "F42", description: "Obsessive-compulsive disorder" },
  "6C40": { code: "F10.2", description: "Alcohol dependence" },
  "6C41": { code: "F11.2", description: "Opioid dependence" },
  "6D10": { code: "F60", description: "Specific personality disorders" },
  "6D70": { code: "F06.7", description: "Mild cognitive disorder" },
  "QD80": { code: "Z73.0", description: "Burn-out" },
  
  // Cardiovascular conditions
  "BA00": { code: "I11", description: "Hypertensive heart disease" },
  "BA01": { code: "I10", description: "Essential (primary) hypertension" },
  "BA40": { code: "I25", description: "Chronic ischemic heart disease" },
  "BA41": { code: "I21", description: "Acute myocardial infarction" },
  "BA42": { code: "I25.9", description: "Chronic ischemic heart disease, unspecified" },
  "BA43": { code: "I20", description: "Angina pectoris" },
  "BA80": { code: "I50", description: "Heart failure" },
  "BA81": { code: "I42", description: "Cardiomyopathy" },
  "BB00": { code: "I49", description: "Other cardiac arrhythmias" },
  "BB01": { code: "I48", description: "Atrial fibrillation and flutter" },
  "BD10": { code: "I67", description: "Other cerebrovascular diseases" },
  "BD11": { code: "I63", description: "Cerebral infarction" },
  
  // Respiratory conditions
  "CA20": { code: "J18", description: "Pneumonia, unspecified organism" },
  "CA21": { code: "J40", description: "Bronchitis, not specified as acute or chronic" },
  "CA22": { code: "J20", description: "Acute bronchitis" },
  "CA23": { code: "J42", description: "Unspecified chronic bronchitis" },
  "CA40": { code: "J44", description: "Other chronic obstructive pulmonary disease" },
  "CA80": { code: "J45", description: "Asthma" },
  "CB00": { code: "J84.1", description: "Other interstitial pulmonary diseases with fibrosis" },
  "CB01": { code: "J96", description: "Respiratory failure, not elsewhere classified" },
  
  // Neoplasms
  "2B60": { code: "C50", description: "Malignant neoplasm of breast" },
  "2B70": { code: "C34", description: "Malignant neoplasm of bronchus and lung" },
  "2B90": { code: "C18", description: "Malignant neoplasm of colon" },
  "2C00": { code: "C61", description: "Malignant neoplasm of prostate" },
  "2C80": { code: "C44", description: "Other and unspecified malignant neoplasm of skin" },
  "2D00": { code: "D10-D36", description: "Benign neoplasms" },
  "2E00": { code: "D37-D48", description: "Neoplasms of uncertain behavior" },
  
  // Neurological conditions
  "8A00": { code: "G40", description: "Epilepsy" },
  "8A20": { code: "G43", description: "Migraine" },
  "8A21": { code: "G44.2", description: "Tension-type headache" },
  "8A40": { code: "G35", description: "Multiple sclerosis" },
  "8A60": { code: "G20", description: "Parkinson's disease" },
  "8B00": { code: "G62", description: "Other and unspecified polyneuropathies" },
  "8B20": { code: "G50.0", description: "Trigeminal neuralgia" },
  "8B60": { code: "G70.0", description: "Myasthenia gravis" },
  "8D00": { code: "G30", description: "Alzheimer's disease" },
  "MB40": { code: "G89", description: "Pain, not elsewhere classified" },
  "MB41": { code: "M79.7", description: "Fibromyalgia" },
  
  // Digestive disorders
  "DA40": { code: "K29", description: "Gastritis and duodenitis" },
  "DA41": { code: "K25", description: "Gastric ulcer" },
  "DA42": { code: "K26", description: "Duodenal ulcer" },
  "DA90": { code: "K58", description: "Irritable bowel syndrome" },
  "DA91": { code: "K50-K52", description: "Noninfective enteritis and colitis" },
  "DA92": { code: "K50", description: "Crohn's disease" },
  "DA93": { code: "K51", description: "Ulcerative colitis" },
  "DB10": { code: "K74", description: "Fibrosis and cirrhosis of liver" },
  "DB30": { code: "K85", description: "Acute pancreatitis" },
  "DB70": { code: "K80", description: "Cholelithiasis" },
  "ME80": { code: "K40-K46", description: "Hernia" },
  
  // Endocrine disorders
  "5A10": { code: "E10", description: "Type 1 diabetes mellitus" },
  "5A11": { code: "E11", description: "Type 2 diabetes mellitus" },
  "5A20": { code: "E05", description: "Thyrotoxicosis [hyperthyroidism]" },
  "5A21": { code: "E03", description: "Other hypothyroidism" },
  "5B80": { code: "E66", description: "Overweight and obesity" },
  "5C50": { code: "E27.1", description: "Primary adrenocortical insufficiency" },
  
  // Genitourinary disorders
  "GB40": { code: "N17", description: "Acute kidney failure" },
  "GB60": { code: "N18", description: "Chronic kidney disease" },
  "GB90": { code: "N20", description: "Calculus of kidney and ureter" },
  "GC00": { code: "N39.0", description: "Urinary tract infection, site not specified" },
  "GC10": { code: "N30", description: "Cystitis" },
  "GA30": { code: "N80", description: "Endometriosis" },
  "GA31": { code: "D25", description: "Leiomyoma of uterus" },
  
  // Infectious diseases
  "1A00": { code: "A00", description: "Cholera" },
  "1C00": { code: "A15-A19", description: "Tuberculosis" },
  "1E00": { code: "B15-B19", description: "Viral hepatitis" },
  "1F00": { code: "B20", description: "Human immunodeficiency virus [HIV] disease" },
  "1G00": { code: "J09-J11", description: "Influenza" },
  "RA01": { code: "U07.1", description: "COVID-19" },
  
  // Injuries
  "NA00": { code: "S06", description: "Intracranial injury" },
  "NA01": { code: "S06.0", description: "Concussion" },
  "NA70": { code: "S14-S34", description: "Injury of nerves and spinal cord" },
  "NB00": { code: "T20-T32", description: "Burns and corrosions" },
  "NC00": { code: "T33-T35", description: "Frostbite" },
  "PB00": { code: "V00-V99", description: "Transport accidents" },
  "PD00": { code: "W00-W19", description: "Falls" },
  "PG00": { code: "W20-W49", description: "Exposure to inanimate mechanical forces" },
  
  // Blood disorders
  "3A00": { code: "D64.9", description: "Anemia, unspecified" },
  "3A01": { code: "D50", description: "Iron deficiency anemia" },
  "3A70": { code: "D68", description: "Other coagulation defects" },
  "3B00": { code: "C91-C95", description: "Leukemia" },
  "3B60": { code: "C81-C86", description: "Lymphoma" },
  
  // Skin conditions
  "EA80": { code: "L30.9", description: "Dermatitis, unspecified" },
  "EA81": { code: "L20", description: "Atopic dermatitis" },
  "EA90": { code: "L40", description: "Psoriasis" },
  "EB00": { code: "L50", description: "Urticaria" },
  "EB40": { code: "L70", description: "Acne" },
  
  // Eye and ear conditions
  "9A00": { code: "H25-H26", description: "Cataract" },
  "9A40": { code: "H40", description: "Glaucoma" },
  "9B00": { code: "H35", description: "Other retinal disorders" },
  "9B70": { code: "H54", description: "Blindness and low vision" },
  "AA00": { code: "H66", description: "Suppurative and unspecified otitis media" },
  "AA40": { code: "H90-H91", description: "Hearing loss" },
  "AB00": { code: "H81", description: "Disorders of vestibular function" },
  "AB30": { code: "H93.1", description: "Tinnitus" },
}

// ICD-11 codes database (common codes for disability case management)
// ICD-11 uses a different coding structure than ICD-10
const ICD11_CODES: { code: string; description: string }[] = [
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
  { code: "6A80", description: "Generalized anxiety disorder" },
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
  { code: "BB01", description: "Atrial fibrillation" },
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
  { code: "2B70", description: "Malignant neoplasm of lung" },
  { code: "2B90", description: "Malignant neoplasm of colon" },
  { code: "2C00", description: "Malignant neoplasm of prostate" },
  { code: "2C80", description: "Malignant neoplasm of skin" },
  { code: "2D00", description: "Benign neoplasm" },
  { code: "2E00", description: "Neoplasm of uncertain behavior" },
  
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
  { code: "GA31", description: "Uterine fibroids" },
  
  // Infectious diseases
  { code: "1A00", description: "Cholera" },
  { code: "1C00", description: "Tuberculosis" },
  { code: "1E00", description: "Hepatitis" },
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
  { code: "EA81", description: "Eczema" },
  { code: "EA90", description: "Psoriasis" },
  { code: "EB00", description: "Urticaria" },
  { code: "EB40", description: "Acne" },
  
  // Eye and ear conditions
  { code: "9A00", description: "Cataract" },
  { code: "9A40", description: "Glaucoma" },
  { code: "9B00", description: "Retinal disorders" },
  { code: "9B70", description: "Vision impairment" },
  { code: "AA00", description: "Otitis media" },
  { code: "AA40", description: "Hearing loss" },
  { code: "AB00", description: "Vertigo" },
  { code: "AB30", description: "Tinnitus" },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const searchLower = query.toLowerCase()
  
  // Search both code and description and include ICD-10 mapping
  const results = ICD11_CODES.filter(
    (item) =>
      item.code.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
  ).slice(0, 15).map((item) => {
    const icd10Match = ICD11_TO_ICD10_MAP[item.code]
    return {
      ...item,
      icd10Code: icd10Match?.code || "",
      icd10Description: icd10Match?.description || "",
    }
  })

  return NextResponse.json({ results })
}

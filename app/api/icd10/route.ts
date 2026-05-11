import { NextRequest, NextResponse } from "next/server"

// NLM Clinical Table Search API for ICD-10-CM codes
const NLM_ICD10_API = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const maxResults = searchParams.get("maxList") || "25"

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // The NLM API accepts:
    // - terms: the search query
    // - maxList: maximum number of results
    // - sf: search fields (code, name)
    // - df: display fields
    const url = new URL(NLM_ICD10_API)
    url.searchParams.set("terms", query)
    url.searchParams.set("maxList", maxResults)
    url.searchParams.set("sf", "code,name")
    url.searchParams.set("df", "code,name")

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`NLM API error: ${response.status}`)
    }

    const data = await response.json()

    // NLM API returns: [totalResults, codeList, null, [code, description] pairs]
    // Format: [7, ["A00", "A00.0", ...], null, [["A00", "Cholera"], ["A00.0", "Cholera due to..."], ...]]
    const results = data[3]?.map((item: [string, string]) => ({
      code: item[0],
      description: item[1],
    })) || []

    return NextResponse.json({ results })
  } catch (error) {
    console.error("ICD-10 search error:", error)
    return NextResponse.json({ results: [], error: "Failed to search ICD-10 codes" }, { status: 500 })
  }
}

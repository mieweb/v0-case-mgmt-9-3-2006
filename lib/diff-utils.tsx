"use client"

export interface DiffResult {
  type: "equal" | "insert" | "delete"
  content: string
}

/**
 * Simple word-level diff algorithm
 * Compares two HTML strings and returns an array of diff results
 */
export function computeDiff(oldText: string, newText: string): DiffResult[] {
  // Strip HTML tags for comparison
  const stripHtml = (html: string) => {
    const div = document.createElement("div")
    div.innerHTML = html
    return div.textContent || div.innerText || ""
  }

  const oldWords = stripHtml(oldText).split(/(\s+)/)
  const newWords = stripHtml(newText).split(/(\s+)/)

  const result: DiffResult[] = []
  let i = 0
  let j = 0

  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      // Rest are insertions
      result.push({ type: "insert", content: newWords[j] })
      j++
    } else if (j >= newWords.length) {
      // Rest are deletions
      result.push({ type: "delete", content: oldWords[i] })
      i++
    } else if (oldWords[i] === newWords[j]) {
      // Equal
      result.push({ type: "equal", content: oldWords[i] })
      i++
      j++
    } else {
      // Check if it's an insertion or deletion
      const oldIndex = newWords.indexOf(oldWords[i], j)
      const newIndex = oldWords.indexOf(newWords[j], i)

      if (oldIndex !== -1 && (newIndex === -1 || oldIndex - j < newIndex - i)) {
        // Likely an insertion
        result.push({ type: "insert", content: newWords[j] })
        j++
      } else {
        // Likely a deletion
        result.push({ type: "delete", content: oldWords[i] })
        i++
      }
    }
  }

  return result
}

/**
 * Render diff results as HTML with color coding
 */
export function renderDiff(diff: DiffResult[]): string {
  return diff
    .map((part) => {
      if (part.type === "insert") {
        return `<span style="background-color: #d4edda; color: #155724; padding: 2px 4px; border-radius: 2px;">${part.content}</span>`
      } else if (part.type === "delete") {
        return `<span style="background-color: #f8d7da; color: #721c24; padding: 2px 4px; border-radius: 2px; text-decoration: line-through;">${part.content}</span>`
      } else {
        return part.content
      }
    })
    .join("")
}

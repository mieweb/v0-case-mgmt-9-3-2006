export interface TodoTemplate {
  title: string
  offset: number
  offsetUnit: "Day" | "Week" | "Month"
  anchor?: "incidentDate" | "caseCreation"
  rrule?: string // Recurrence rule in iCalendar format
}

export interface ParsedTodo {
  title: string
  dueDate: Date
  description: string
}

/**
 * Parses a markdown-style todo template string
 * Format: "Todo Title; offset=N Unit; anchor=anchorName; rrule=FREQ=..."
 */
export function parseTodoTemplate(template: string): TodoTemplate | null {
  try {
    const parts = template.split(";").map((p) => p.trim())
    if (parts.length === 0) return null

    const title = parts[0].replace(/^-\s*"?|"?$/g, "").trim()
    if (!title) return null

    const result: TodoTemplate = {
      title,
      offset: 0,
      offsetUnit: "Day",
      anchor: "incidentDate",
    }

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      
      // Parse offset
      const offsetMatch = part.match(/offset=(\d+)\s*(Day|Week|Month)/i)
      if (offsetMatch) {
        result.offset = parseInt(offsetMatch[1], 10)
        result.offsetUnit = offsetMatch[2] as "Day" | "Week" | "Month"
      }

      // Parse anchor
      const anchorMatch = part.match(/anchor=(\w+)/i)
      if (anchorMatch) {
        result.anchor = anchorMatch[1] as "incidentDate" | "caseCreation"
      }

      // Parse rrule
      const rruleMatch = part.match(/rrule=(.+)/i)
      if (rruleMatch) {
        result.rrule = rruleMatch[1].trim()
      }
    }

    return result
  } catch (error) {
    console.error("Failed to parse todo template:", template, error)
    return null
  }
}

/**
 * Calculates actual todo entries from templates based on anchor dates
 */
export function generateTodosFromTemplates(
  templates: string[],
  anchorDates: {
    caseCreation: Date
    incidentDate?: Date
  }
): ParsedTodo[] {
  const todos: ParsedTodo[] = []

  for (const templateStr of templates) {
    const template = parseTodoTemplate(templateStr)
    if (!template) continue

    // Default to incident date, fall back to case creation if not provided
    const anchorDate = template.anchor === "incidentDate"
      ? anchorDates.incidentDate || anchorDates.caseCreation
      : anchorDates.caseCreation

    // Calculate the base due date
    const dueDate = new Date(anchorDate)
    switch (template.offsetUnit) {
      case "Day":
        dueDate.setDate(dueDate.getDate() + template.offset)
        break
      case "Week":
        dueDate.setDate(dueDate.getDate() + template.offset * 7)
        break
      case "Month":
        dueDate.setMonth(dueDate.getMonth() + template.offset)
        break
    }

    // Generate description
    let description = `Offset: ${template.offset} ${template.offsetUnit}`
    if (template.anchor && template.anchor === "incidentDate") {
      description += ` from incident date`
    }
    if (template.rrule) {
      description += ` | Recurrence: ${template.rrule}`
    }

    todos.push({
      title: template.title,
      dueDate,
      description,
    })

    // Handle recurrence if present
    if (template.rrule) {
      const recurrenceTodos = generateRecurringTodos(template, dueDate)
      todos.push(...recurrenceTodos)
    }
  }

  return todos.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Generates recurring todo instances based on rrule
 */
function generateRecurringTodos(
  template: TodoTemplate,
  startDate: Date
): ParsedTodo[] {
  if (!template.rrule) return []

  const todos: ParsedTodo[] = []
  const rruleParts = template.rrule.split(";")
  
  let freq = "WEEKLY"
  let interval = 1
  let count = 10 // default max occurrences

  for (const part of rruleParts) {
    const [key, value] = part.split("=")
    if (key === "FREQ") freq = value
    if (key === "INTERVAL") interval = parseInt(value, 10)
    if (key === "COUNT") count = parseInt(value, 10)
  }

  for (let i = 1; i < count; i++) {
    const dueDate = new Date(startDate)
    
    switch (freq) {
      case "DAILY":
        dueDate.setDate(dueDate.getDate() + interval * i)
        break
      case "WEEKLY":
        dueDate.setDate(dueDate.getDate() + interval * 7 * i)
        break
      case "MONTHLY":
        dueDate.setMonth(dueDate.getMonth() + interval * i)
        break
    }

    todos.push({
      title: `${template.title} (#${i + 1})`,
      dueDate,
      description: `Recurring: ${freq} every ${interval} | Occurrence ${i + 1} of ${count}`,
    })
  }

  return todos
}

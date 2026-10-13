const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const STYLES = {
  title: "font-size: 1.05em; font-weight: 700; margin: 0 0 4px 0; letter-spacing: 0.02em;",
  subtitle: "font-style: italic; opacity: 0.75; margin: 0 0 14px 0;",
  heading:
    "font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 18px 0 6px 0; padding-bottom: 3px; border-bottom: 1px solid currentColor;",
  field: "margin: 0 0 6px 0; line-height: 1.5;",
  paragraph: "margin: 0 0 10px 0; line-height: 1.5;",
  note: "font-style: italic; opacity: 0.75; margin: 0 0 10px 0;",
  callout: "font-weight: 600; margin: 0 0 12px 0; padding: 6px 10px; border: 1px solid currentColor; border-radius: 4px;",
  list: "margin: 0 0 10px 0; padding-left: 22px; line-height: 1.5;",
  listItem: "margin: 0 0 4px 0;",
  subNote: "display: block; font-style: italic; opacity: 0.75; margin-top: 2px;",
}

const isHeading = (line: string) =>
  /^[A-Z0-9&/\-–,' ]+$/.test(line) && /[A-Z]{3,}/.test(line) && !line.endsWith(":")

const isParenthetical = (line: string) => /^\(.*\)$/.test(line)
const isCallout = (line: string) => /^\*.*\*$/.test(line)
const bulletMatch = (line: string) => line.match(/^[-•]\s+(.*)$/)
const numberMatch = (line: string) => line.match(/^(\d+)[.)]\s+(.*)$/)

/** Bold the label portion of "Label: value" / "Label:" / "Question?" lines. */
const formatField = (line: string) => {
  const colonIndex = line.indexOf(":")
  if (colonIndex > 0 && colonIndex < 250) {
    const label = escapeHtml(line.slice(0, colonIndex + 1))
    const rest = escapeHtml(line.slice(colonIndex + 1).trim())
    return `<p style="${STYLES.field}"><strong>${label}</strong> ${rest || "&nbsp;"}</p>`
  }
  if (line.endsWith("?")) {
    return `<p style="${STYLES.field}"><strong>${escapeHtml(line)}</strong> &nbsp;</p>`
  }
  return `<p style="${STYLES.paragraph}">${escapeHtml(line)}</p>`
}

/**
 * Converts a plain-text case note template into structured, readable HTML.
 * Content that is already HTML is returned unchanged.
 */
export function formatNoteTemplate(content: string): string {
  if (/<\/?(p|div|h[1-6]|ul|ol|br)\b/i.test(content)) return content

  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const html: string[] = []
  let listType: "ul" | "ol" | null = null
  let titleRendered = false

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  const openList = (type: "ul" | "ol") => {
    if (listType !== type) {
      closeList()
      html.push(`<${type} style="${STYLES.list}">`)
      listType = type
    }
  }

  lines.forEach((rawLine, index) => {
    const isIndented = /^\s{2,}\S/.test(rawLine)
    const line = rawLine.trim()

    if (!line) {
      // A blank line between numbered items should not break the list numbering.
      const nextLine = lines.slice(index + 1).find((l) => l.trim())?.trim() ?? ""
      if (!(listType === "ol" && numberMatch(nextLine))) closeList()
      return
    }

    // Indented continuation text under a list item becomes a sub-note on that item.
    if (isIndented && listType) {
      const lastIndex = html.length - 1
      html[lastIndex] = html[lastIndex].replace(
        /(<br>&nbsp;)?<\/li>$/,
        `<span style="${STYLES.subNote}">${escapeHtml(line)}</span>$1</li>`,
      )
      return
    }

    if (!titleRendered && index === 0 && isHeading(line)) {
      html.push(`<p style="${STYLES.title}">${escapeHtml(line)}</p>`)
      titleRendered = true
      return
    }

    const bullet = bulletMatch(line)
    if (bullet) {
      openList("ul")
      html.push(`<li style="${STYLES.listItem}">${escapeHtml(bullet[1])}</li>`)
      return
    }

    const numbered = numberMatch(line)
    if (numbered) {
      openList("ol")
      html.push(
        `<li value="${numbered[1]}" style="${STYLES.listItem}"><strong>${escapeHtml(numbered[2])}</strong><br>&nbsp;</li>`,
      )
      return
    }

    closeList()

    if (isParenthetical(line)) {
      html.push(`<p style="${titleRendered && html.length === 1 ? STYLES.subtitle : STYLES.note}">${escapeHtml(line)}</p>`)
    } else if (isCallout(line)) {
      html.push(`<p style="${STYLES.callout}">${escapeHtml(line.replace(/^\*|\*$/g, ""))}</p>`)
    } else if (isHeading(line)) {
      html.push(`<p style="${STYLES.heading}">${escapeHtml(line)}</p>`)
    } else {
      html.push(formatField(line))
    }
  })

  closeList()
  return html.join("")
}

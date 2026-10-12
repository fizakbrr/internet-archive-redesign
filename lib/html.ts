const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }

/**
 * Item descriptions are uploader HTML. Render them as plain text (paragraphs kept),
 * never as markup, so no uploader HTML reaches the page.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|h[1-6])\b[^>]*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m
      }
      return ENTITIES[e.toLowerCase()] ?? m
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

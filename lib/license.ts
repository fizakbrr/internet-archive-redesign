/** Plain-language usage rights for a licenseurl. */
export function licenseLabel(url?: string): string | null {
  if (!url) return null
  const u = url.toLowerCase()
  if (u.includes("publicdomain")) return "Public domain. You can copy, share and reuse it freely."
  const cc = /creativecommons\.org\/licenses\/([a-z-]+)\/([\d.]+)/.exec(u)
  if (cc) {
    const parts = cc[1].toUpperCase().split("-").join("-")
    return `Creative Commons ${parts} ${cc[2]}. Reuse is allowed on the license's terms.`
  }
  return "See the license for reuse terms."
}

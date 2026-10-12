// "example.com", "www.example.com/path", "http://x.org" count as URLs; plain words and phrases do not.
const URL_LIKE = /^(https?:\/\/)?(www\.)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i

export function looksLikeUrl(input: string): boolean {
  const s = input.trim()
  return s.length > 0 && !/\s/.test(s) && URL_LIKE.test(s)
}

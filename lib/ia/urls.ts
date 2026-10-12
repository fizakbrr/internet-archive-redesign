// Client-safe archive.org URL builders (no server-only import).

export const thumbnailUrl = (id: string) => `https://archive.org/services/img/${encodeURIComponent(id)}`

export const downloadUrl = (id: string, file: string) =>
  `https://archive.org/download/${encodeURIComponent(id)}/${file.split("/").map(encodeURIComponent).join("/")}`

export const archiveUrl = (id: string) => `https://archive.org/details/${encodeURIComponent(id)}`

export const waybackUrl = (timestamp: string, url: string) => `https://web.archive.org/web/${timestamp}/${url}`

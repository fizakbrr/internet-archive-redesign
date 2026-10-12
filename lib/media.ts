import {
  AudioLines,
  BookOpen,
  Clapperboard,
  Database,
  File,
  Globe,
  History,
  Image,
  Library,
  Music,
  Save,
  type LucideIcon,
} from "lucide-react"

export type MediaType = "texts" | "movies" | "audio" | "software" | "image" | "web" | "collection"

type Info = { label: string; plural: string; Icon: LucideIcon }

export const MEDIA: Record<MediaType, Info> = {
  texts: { label: "Text", plural: "Books", Icon: BookOpen },
  movies: { label: "Video", plural: "Video", Icon: Clapperboard },
  audio: { label: "Audio", plural: "Audio", Icon: AudioLines },
  software: { label: "Software", plural: "Software", Icon: Save },
  image: { label: "Image", plural: "Images", Icon: Image },
  web: { label: "Web", plural: "Web", Icon: Globe },
  collection: { label: "Collection", plural: "Collections", Icon: Library },
}

// Mediatypes that appear in search facets but have no nav entry.
const OTHER: Record<string, Info> = {
  etree: { label: "Concert", plural: "Concerts", Icon: Music },
  data: { label: "Data", plural: "Data", Icon: Database },
}

export const mediaInfo = (type: string): Info =>
  MEDIA[type as MediaType] ?? OTHER[type] ?? { label: type || "Item", plural: type || "Items", Icon: File }

export const WaybackIcon = History

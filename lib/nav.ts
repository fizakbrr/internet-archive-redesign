import { MEDIA, WaybackIcon, type MediaType } from "@/lib/media"

const browse = (type: MediaType) => ({
  label: MEDIA[type].plural,
  href: `/search?mediatype=${type}`,
  Icon: MEDIA[type].Icon,
  mediatype: type as string,
})

export const EXPLORE = [
  browse("texts"),
  browse("movies"),
  browse("audio"),
  browse("software"),
  browse("image"),
  { label: "Wayback Machine", href: "/wayback", Icon: WaybackIcon, mediatype: null },
  browse("collection"),
]

export const ARCHIVE_ORG = "https://archive.org"

export const FOOTER_GROUPS = [
  { title: "Explore", links: EXPLORE.slice(0, 6).map(({ label, href }) => ({ label, href })) },
  {
    title: "About",
    links: [
      { label: "About the Archive", href: `${ARCHIVE_ORG}/about/` },
      { label: "Blog", href: "https://blog.archive.org" },
      { label: "Projects", href: `${ARCHIVE_ORG}/projects/` },
      { label: "Help center", href: "https://help.archive.org" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { label: "Donate", href: `${ARCHIVE_ORG}/donate` },
      { label: "Volunteer", href: `${ARCHIVE_ORG}/about/volunteerpositions.php` },
      { label: "Jobs", href: `${ARCHIVE_ORG}/about/jobs.php` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of use", href: `${ARCHIVE_ORG}/about/terms.php` },
      { label: "Privacy", href: `${ARCHIVE_ORG}/about/terms.php#privacy` },
      { label: "Accessibility", href: `${ARCHIVE_ORG}/about/accessibility.php` },
      { label: "Contact", href: `${ARCHIVE_ORG}/about/contact.php` },
    ],
  },
]

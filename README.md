# Internet Archive Redesign

An unofficial redesign concept for [archive.org](https://archive.org). It keeps what the Archive is for (free access to books, film, audio, software, images and archived web pages) and rebuilds the interface around search, readable item pages and accessibility.

This project is not affiliated with or endorsed by the Internet Archive. "Internet Archive" and its logo are trademarks of the Internet Archive. All item data shown in the app comes from the Archive's public APIs.

## Status

Design phase. The design system, wireframes and mockups are being built in Figma. Application code follows once the designs are approved.

## What changes

- One search box for everything, with visible filters, rights and availability facets, and real pagination. Pasting a URL switches to a Wayback Machine lookup.
- Item pages with one main action (play, read or download), download formats in plain language with file sizes, and raw metadata tucked behind a disclosure.
- Collection pages that reuse the same search, plus a year timeline for browsing periodicals and long runs.
- Labeled navigation, one heading per page, keyboard support and WCAG AA contrast.
- Mobile-first layouts tested at 375, 768 and 1280 px.

## Planned stack

- Next.js (App Router) with TypeScript
- Tailwind CSS v4 and shadcn/ui on Radix primitives
- Lucide icons
- Native `<video>` and `<audio>` players; books open in the Archive's own embed

## Data sources

| Feature | Endpoint |
| --- | --- |
| Search and facets | `archive.org/services/search/beta/page_production` (undocumented, wrapped in one adapter) |
| Fallback search | `archive.org/advancedsearch.php` |
| Item metadata and reviews | `archive.org/metadata/{identifier}` |
| Thumbnails and files | `archive.org/services/img/{identifier}`, `archive.org/download/{identifier}/{file}` |
| Wayback lookup | `archive.org/wayback/available`, CDX server (proxied server-side) |

The public APIs have no third-party login, so signing in, favorites, reviews, uploads and borrowing either link out to archive.org or use clearly labeled demo data stored only in your browser.

## Setup

There is no application code yet. Setup steps come with the first commit of the app.

## Branches

- `main`: stable
- `development`: active work

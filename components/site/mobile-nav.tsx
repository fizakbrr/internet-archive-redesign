"use client"

import { ChevronRight, ExternalLink, Heart, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SearchBar } from "@/components/search-bar"
import { buttonVariants, Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ARCHIVE_ORG, EXPLORE } from "@/lib/nav"
import { Logo } from "./logo"

const SECONDARY = [
  { label: "About the Archive", href: `${ARCHIVE_ORG}/about/` },
  { label: "Help center", href: "https://help.archive.org" },
  { label: "Your favorites (demo)", href: "/favorites" },
]

// Text-only drawer (no icons), per the mobile navigation mockup.
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="inverse" size="icon" className="lg:hidden" />}>
        <Menu />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="gap-0 overflow-y-auto data-[side=left]:w-full data-[side=left]:sm:max-w-sm">
        <div className="flex h-14 shrink-0 items-center justify-between bg-inverse pr-2 pl-4 text-fg-inverse">
          <div onClick={close}>
            <Logo />
          </div>
          <SheetClose render={<Button variant="inverse" size="icon" />}>
            <X />
            <span className="sr-only">Close menu</span>
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex flex-col gap-4 p-4">
          <SearchBar />
          <nav aria-label="Browse">
            <ul>
              {EXPLORE.map(({ label, href }) => (
                <li key={href} className="border-b border-line-subtle">
                  <Link href={href} onClick={close} className="flex h-14 items-center justify-between type-h4">
                    {label}
                    <ChevronRight className="size-5 text-fg-secondary" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="py-2">
              {SECONDARY.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} onClick={close} className="flex h-12 items-center type-body text-fg-secondary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3">
            <a href={`${ARCHIVE_ORG}/donate`} className={buttonVariants()}>
              <Heart />
              Donate
            </a>
            <a href={`${ARCHIVE_ORG}/account/login`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
              <ExternalLink />
              Sign in on archive.org
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

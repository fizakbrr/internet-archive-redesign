import { Heart, Search, User } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { HandoffDialog } from "@/components/feedback/handoff-dialog"
import { buttonVariants, Button } from "@/components/ui/button"
import { ARCHIVE_ORG } from "@/lib/nav"
import { HeaderSearch, NavLinks, NavRow } from "./header-client"
import { Logo } from "./logo"
import { MobileNav } from "./mobile-nav"

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-inverse text-fg-inverse">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-2 md:px-6 lg:h-16 lg:gap-6 lg:px-8">
          <MobileNav />
          <Logo />
          <Suspense>
            <HeaderSearch />
          </Suspense>
          <div className="ml-auto flex items-center gap-1 lg:gap-4">
            <Link href="/search" className={buttonVariants({ variant: "inverse", size: "icon", className: "lg:hidden" })}>
              <Search />
              <span className="sr-only">Search</span>
            </Link>
            <a href={`${ARCHIVE_ORG}/donate`} className={buttonVariants({ className: "hidden lg:inline-flex" })}>
              <Heart />
              Donate
            </a>
            <HandoffDialog
              trigger={
                <Button variant="inverse" className="max-lg:size-11 max-lg:px-0">
                  <User />
                  <span className="max-lg:sr-only">Sign in</span>
                </Button>
              }
            />
          </div>
        </div>
      </div>
      <nav aria-label="Browse" className="hidden border-b border-line bg-canvas lg:block">
        <Suspense fallback={<NavLinks active={null} />}>
          <NavRow />
        </Suspense>
      </nav>
    </header>
  )
}

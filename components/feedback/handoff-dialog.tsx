"use client"

import { ExternalLink } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const DEFAULT_BODY =
  "This redesign is a read-only concept. Signing in, favorites that sync, reviews, uploads and borrowing happen on archive.org in a new tab. Your place here is kept."

// Account actions the public APIs cannot do: explain, then open archive.org in a new tab.
export function HandoffDialog({
  trigger,
  title = "Sign in on archive.org",
  body = DEFAULT_BODY,
  href = "https://archive.org/account/login",
}: {
  trigger: React.ReactElement
  title?: string
  body?: string
  href?: string
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{body}</DialogDescription>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
            <ExternalLink />
            Continue to archive.org
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

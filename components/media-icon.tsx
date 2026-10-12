"use client"

import { cn } from "cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { mediaInfo } from "@/lib/media"

// Icon only; the type name is the accessible name and a tooltip on hover and keyboard focus.
export function MediaIcon({ type, className }: { type: string; className?: string }) {
  const { label, Icon } = mediaInfo(type)
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span role="img" aria-label={label} tabIndex={0} className={cn("inline-flex rounded-sm text-fg-secondary", className)} />}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

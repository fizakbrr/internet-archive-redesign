import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const variants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent type-label whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:border-transparent disabled:bg-disabled disabled:text-fg-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        // Same fill as primary; reserved for search submit so a view keeps one Primary.
        accent: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary:
          "border-line-strong bg-secondary text-fg hover:bg-secondary-hover aria-expanded:bg-secondary-hover",
        ghost: "text-fg hover:bg-sunken aria-expanded:bg-sunken",
        inverse: "text-fg-inverse hover:bg-line-inverse",
      },
      size: {
        md: "h-11 px-4",
        sm: "h-9 px-3",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

// cva only concatenates; cn resolves conflicts such as "inline-flex" vs a caller's "hidden".
const buttonVariants = ({ className, ...p }: VariantProps<typeof variants> & { className?: string } = {}) =>
  cn(variants(p), className)

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof variants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(variants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }

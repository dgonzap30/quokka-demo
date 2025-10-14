import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-250 overflow-hidden",
  {
    variants: {
      size: {
        default: "min-h-[24px]",
        interactive: "min-h-11 px-4 py-2 text-sm lg:min-h-[24px] lg:px-2.5 lg:py-1 lg:text-xs",
      },
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ai:
          "border-transparent bg-gradient-to-r from-ai-indigo-500 to-ai-purple-500 text-white [a&]:hover:from-ai-indigo-600 [a&]:hover:to-ai-purple-600 shadow-ai-sm",
        "ai-outline":
          "border-ai-purple-500 bg-ai-purple-50 text-ai-purple-700 dark:bg-ai-purple-950/30 dark:text-ai-purple-300 [a&]:hover:bg-ai-purple-100 dark:[a&]:hover:bg-ai-purple-900/30",
        "ai-shimmer":
          "border-transparent bg-gradient-to-r from-ai-indigo-500 via-ai-purple-500 to-ai-cyan-500 bg-[length:200%_100%] text-white animate-shimmer shadow-ai-sm",
        "confidence-high":
          "border bg-success/10 text-success border-success/20 dark:bg-success/20 dark:border-success/30",
        "confidence-medium":
          "border bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:border-warning/30",
        "confidence-low":
          "border bg-danger/10 text-danger border-danger/20 dark:bg-danger/20 dark:border-danger/30",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

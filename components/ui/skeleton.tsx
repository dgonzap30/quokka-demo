import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const skeletonVariants = cva(
  "rounded-md",
  {
    variants: {
      variant: {
        pulse: "bg-accent animate-pulse",
        shimmer: "bg-gradient-to-r from-glass-medium via-glass-strong to-glass-medium bg-[length:200%_100%] animate-shimmer",
        glass: "bg-glass-medium animate-pulse",
      },
    },
    defaultVariants: {
      variant: "pulse",
    },
  }
)

function Skeleton({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }

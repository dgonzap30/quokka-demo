import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm transition-all duration-250",
  {
    variants: {
      variant: {
        default: "p-6",
        ai: "p-8 relative border-l-4 border-l-ai-purple-500 bg-gradient-to-br from-ai-purple-50/50 via-ai-indigo-50/30 to-ai-cyan-50/50 dark:from-ai-purple-950/20 dark:via-ai-indigo-950/15 dark:to-ai-cyan-950/20 shadow-ai-sm hover:shadow-ai-md",
        "ai-hero": "p-8 relative border-2 border-transparent rounded-xl shadow-[var(--shadow-e3)] hover:shadow-ai-lg transition-shadow duration-300 [background:linear-gradient(var(--card),var(--card))_padding-box,var(--ai-gradient-border)_border-box] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-ai-purple-50/30 before:to-ai-cyan-50/30 before:-z-10 dark:before:from-ai-purple-950/20 dark:before:to-ai-cyan-950/20",
        hover: "p-6 hover:shadow-e2 hover:-translate-y-1 cursor-pointer",
        elevated: "p-8 shadow-e2",
        glass: "p-6 glass-panel",
        "glass-strong": "p-6 glass-panel-strong",
        "glass-hover": "p-6 glass-panel hover:glass-panel-strong hover:-translate-y-1 hover:shadow-[var(--shadow-glass-lg)] cursor-pointer",
        "glass-liquid": "p-6 glass-panel liquid-border hover:shadow-[var(--glow-accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

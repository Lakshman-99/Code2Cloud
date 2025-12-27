import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline:
          "text-foreground border-white/20",
        success:
          "border-transparent bg-success/20 text-success",
        warning:
          "border-transparent bg-warning/20 text-warning",
        info:
          "border-transparent bg-info/20 text-info",
        nextjs:
          "border-transparent bg-white/10 text-foreground",
        python:
          "border-transparent bg-yellow-500/20 text-yellow-400",
        glass:
          "border-white/10 bg-white/5 text-foreground backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);


function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

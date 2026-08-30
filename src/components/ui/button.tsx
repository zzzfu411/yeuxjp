import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm border text-sm font-semibold ring-offset-background transition-[transform,background-color,color,border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      variant: {
        default: "border-accent/70 bg-accent text-accent-foreground shadow-paper-soft hover:bg-accent/90",
        destructive: "border-destructive/70 bg-destructive text-destructive-foreground shadow-paper-soft",
        outline: "border-border/70 bg-card/55 text-foreground shadow-none hover:bg-primary/10",
        secondary: "border-border/50 bg-secondary/50 text-secondary-foreground shadow-none hover:bg-secondary/80",
        ghost: "border-transparent bg-transparent shadow-none hover:border-border/50 hover:bg-primary/10",
        link: "border-transparent bg-transparent shadow-none underline-offset-4 hover:translate-y-0 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

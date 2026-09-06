import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[0.1px] transition-[background-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/92 hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/92",
        outline:
          "border border-input bg-transparent text-primary hover:bg-primary/8",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]",
        ghost: "text-primary hover:bg-primary/8",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "h-10 px-5 py-2",
        "xs": "h-7 px-3 text-xs",
        "sm": "h-8 px-4 text-xs",
        "lg": "h-12 px-7 text-[15px]",
        "icon": "h-10 w-10",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

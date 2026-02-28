import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-sweep inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-primary to-[#178AF0] text-primary-foreground font-semibold hover:brightness-105 hover:-translate-y-0.5 transition-all duration-300",
        secondary:
          "border border-slate-950 bg-slate-950 font-semibold text-white hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300",
        default:
          "bg-gradient-to-r from-primary to-[#178AF0] text-primary-foreground font-semibold hover:brightness-105 hover:-translate-y-0.5 transition-all duration-300",
        destructive:
          "border border-slate-950 bg-slate-950 font-semibold text-white hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300",
        outline:
          "border border-slate-950 bg-slate-950 font-semibold text-white hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300",
        ghost: "bg-transparent text-slate-900 hover:bg-slate-100 hover:text-slate-900",
        link: "text-slate-900 underline-offset-4 hover:underline",
        "hero-outline":
          "border border-slate-950 bg-slate-950 font-semibold text-white hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

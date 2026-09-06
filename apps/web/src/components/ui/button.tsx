import { cva, type VariantProps } from "class-variance-authority";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
} from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:opacity-90 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-dark",
        secondary:
          "bg-secondary text-surface shadow-xs hover:bg-secondary-dark",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-muted hover:border-border/60",
      },
      size: {
        sm: "h-10 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ className, size, variant }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

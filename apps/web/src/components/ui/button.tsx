import { cva, type VariantProps } from "class-variance-authority";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
} from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-light/50 active:scale-95 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "border border-primary-light/30 bg-primary/90 text-surface shadow-lg shadow-primary/40 backdrop-blur-md hover:-translate-y-0.5 hover:bg-primary hover:shadow-xl hover:shadow-primary/60",
        secondary:
          "border border-secondary-light/30 bg-secondary/90 text-surface shadow-md backdrop-blur-md hover:-translate-y-0.5 hover:bg-secondary",
        ghost:
          "bg-transparent text-foreground hover:bg-white/10 hover:backdrop-blur-md dark:hover:bg-black/20",
        outline:
          "border border-white/10 bg-white/5 text-foreground backdrop-blur-md hover:border-white/20 hover:bg-white/10 dark:hover:bg-black/20",
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

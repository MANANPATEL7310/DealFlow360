import { type HTMLAttributes, type PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type AnimationVariant = "fade-in" | "slide-up" | "slide-down" | "scale-in";

type AnimateProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AnimationVariant;
  delayMs?: number;
};

export function Animate({
  children,
  className,
  variant = "fade-in",
  delayMs = 0,
  ...props
}: PropsWithChildren<AnimateProps>) {
  const animationClass = {
    "fade-in": "animate-fade-in",
    "slide-up": "animate-slide-up",
    "slide-down": "animate-slide-down",
    "scale-in": "animate-scale-in",
  }[variant];

  return (
    <div
      className={cn(animationClass, className)}
      style={{
        animationFillMode: "both",
        animationDelay: `${delayMs}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn("surface-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5", className)} {...props} />;
}

import { cn } from "@/lib/cn";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary/30 border-t-primary",
        sizeMap[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

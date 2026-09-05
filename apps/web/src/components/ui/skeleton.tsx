import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface-muted/70 dark:bg-surface-muted/50",
        className,
      )}
      {...props}
    />
  );
}

export default Skeleton;

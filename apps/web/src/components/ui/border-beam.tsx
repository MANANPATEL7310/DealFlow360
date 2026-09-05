import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 220,
  duration = 14,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "var(--primary)",
  colorTo = "var(--secondary)",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as CSSProperties
      }
      className={cn("border-beam-container border-beam-runner", className)}
    />
  );
}

export default BorderBeam;

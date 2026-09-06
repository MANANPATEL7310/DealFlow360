import { cn } from "@/lib/cn";

export interface BorderBeamProps {
  className?: string;
  /** Seconds for one full revolution. */
  duration?: number;
  /** Border thickness in px. */
  borderWidth?: number;
  /** Leading edge color of the travelling arc. */
  colorFrom?: string;
  /** Trailing edge color of the travelling arc. */
  colorTo?: string;
  /** Animation delay in seconds (stagger multiple beams). */
  delay?: number;
}

/**
 * A subtle animated arc that travels around the border of its (relatively
 * positioned) parent. Used to draw attention to AI-powered surfaces without
 * enlarging their icons. Respects prefers-reduced-motion via the CSS keyframe.
 */
export function BorderBeam({
  className,
  duration = 6,
  borderWidth = 1.5,
  colorFrom = "var(--primary)",
  colorTo = "var(--secondary)",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 border-beam",
        className,
      )}
      style={{
        borderRadius: "inherit",
        padding: `${borderWidth}px`,
        background: `conic-gradient(from var(--border-beam-angle, 0deg), transparent 0%, ${colorFrom} 12%, ${colorTo} 22%, transparent 34%)`,
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default BorderBeam;

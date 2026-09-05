import {
  useRef,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { cn } from "@/lib/cn";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  className?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "color-mix(in srgb, var(--primary) 18%, transparent)",
  ...props
}: PropsWithChildren<SpotlightCardProps>) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(0.65);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-xl transition-all duration-300",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}

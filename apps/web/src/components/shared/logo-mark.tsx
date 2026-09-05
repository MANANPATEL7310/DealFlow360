import { Layers } from "lucide-react";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
        <Layers className="size-5" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-foreground">DealFlow</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">360</span>
        </div>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Sales Operations
        </p>
      </div>
    </div>
  );
}

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-surface shadow-md">
        <Sparkles className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          Project
        </p>
        <p className="text-base font-semibold text-foreground">Template</p>
      </div>
    </div>
  );
}

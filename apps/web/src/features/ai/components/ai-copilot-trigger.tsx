import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiCopilotStore } from "../stores/ai-copilot-store";

export function AiCopilotTrigger() {
  const { toggleOpen, isOpen } = useAiCopilotStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleOpen}
      type="button"
      className={`relative gap-2 border text-xs font-semibold transition-all ${
        isOpen
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-primary/40 bg-background/90 text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
      }`}
      title="Open DealFlow AI Copilot"
    >
      <div className="relative flex items-center justify-center">
        <Sparkles className="size-3.5 text-primary animate-pulse" />
        <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      </div>

      <span className="hidden sm:inline">AI Copilot</span>
    </Button>
  );
}

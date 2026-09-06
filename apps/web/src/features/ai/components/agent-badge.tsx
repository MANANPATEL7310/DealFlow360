import { Cpu, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface AgentBadgeProps {
  /** Human label for the agent, e.g. "Discount Approval". */
  label: string;
  /** Optional agent number for the demo taxonomy, e.g. 1. */
  agentNo?: number;
  /** Model chip text. */
  model?: string;
  className?: string;
}

/**
 * Consistent "powered by an AI agent" marker used across feature cards. Keeps
 * the icon small on purpose — prominence comes from the accent color, the model
 * chip, and the explicit label rather than icon size.
 */
export function AgentBadge({
  label,
  agentNo,
  model = "Claude 4.5",
  className,
}: AgentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      <Sparkles className="size-3 shrink-0" />
      <span className="whitespace-nowrap">
        {agentNo ? `Agent ${agentNo} · ` : ""}
        {label}
      </span>
      <span className="mx-0.5 h-3 w-px bg-primary/30" aria-hidden />
      <span className="inline-flex items-center gap-1 font-mono">
        <Cpu className="size-2.5" />
        {model}
      </span>
    </span>
  );
}

export default AgentBadge;

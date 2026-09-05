import { useState } from "react";
import {
  FileSpreadsheet,
  ShieldAlert,
  GitPullRequest,
  MessageSquareCheck,
  Truck,
  Receipt,
  CheckCircle,
} from "lucide-react";

export function WorkflowStepper() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "builder",
      title: "1. Quotation Builder",
      subtitle: "Multi-line CPQ workspace",
      icon: FileSpreadsheet,
      badge: "Sales Rep",
      summary:
        "Reps assemble quotes with products, variants, and price lists. Live margin calculation updates in real time with every line addition.",
      details: [
        "Product catalog with multi-tier price lists",
        "Dynamic line-item & global order discounts",
        "Instant live margin and subtotal calculation",
        "Real-time upsell and cross-sell recommendation side panel",
      ],
      kpi: "Real-time Margin Math",
    },
    {
      id: "risk",
      title: "2. Blended-Risk Gate",
      subtitle: "Deterministic margin guardrails",
      icon: ShieldAlert,
      badge: "Automated Engine",
      summary:
        "The blended-risk engine evaluates effective ceilings min(tierCeiling, categoryCeiling) and computes value-weighted violation scores.",
      details: [
        "Worst-line violation detection for egregious discounts",
        "Value-weighted blended score across full order value",
        "Categorical ceilings: Hardware vs. Services vs. Recurring",
        "Customer tier ceilings: Bronze 5%, Silver 10%, Gold 15%",
      ],
      kpi: "PS §10 Crown-Jewel Rule",
    },
    {
      id: "approval",
      title: "3. Approval Routing",
      subtitle: "Multi-tier escalation chain",
      icon: GitPullRequest,
      badge: "Manager & Finance",
      summary:
        "Quotations exceeding risk thresholds route automatically. Zero manual chase emails. Approvers approve, return with revision notes, or reject.",
      details: [
        "Zero-violation quotes are auto-approved instantly",
        "Moderate violations route strictly to Sales Manager",
        "High-risk & high-value quotes require Sales Manager + Finance dual signoff",
        "Full audit trail logs who decided, timestamp, and reason",
      ],
      kpi: "100% Policy Enforcement",
    },
    {
      id: "negotiation",
      title: "4. Customer Negotiation",
      subtitle: "Scoped customer portal",
      icon: MessageSquareCheck,
      badge: "Customer Portal",
      summary:
        "Customers access a dedicated, scoped negotiation view via magic link. They can accept terms or counter-propose specific line discounts.",
      details: [
        "Separate authenticated session restricted to quotation ID",
        "Line-item commenting and counter-offer proposal",
        "Counter-proposals past thresholds automatically re-enter approval",
        "One-click final acceptance locks terms into contract",
      ],
      kpi: "Restricted Scoped Session",
    },
    {
      id: "fulfillment",
      title: "5. Warehouse Split",
      subtitle: "Multi-warehouse fulfillment",
      icon: Truck,
      badge: "Operations",
      summary:
        "Confirmed orders evaluate inventory across all warehouses and automatically split shipments based on stock availability.",
      details: [
        "Automatic stock allocation across multiple regional facilities",
        "Split shipment cost optimization and weight routing",
        "Backorder generation for items exceeding available inventory",
        "Consolidated backorder fulfillment tracking upon replenishment",
      ],
      kpi: "Automated Inventory Routing",
    },
    {
      id: "billing",
      title: "6. Hybrid Billing & Cash",
      subtitle: "One-time + recurring billing",
      icon: Receipt,
      badge: "Finance",
      summary:
        "DealFlow360 generates invoices for one-time purchases and provisions subscription schedules with proration on the same quotation.",
      details: [
        "Mixed line items billed cleanly on one unified order",
        "Automated recurring subscription schedules (monthly/annual)",
        "Proration rules and automated credit note issuance",
        "Integrated payment logging and real-time invoice status",
      ],
      kpi: "Unified Quote-to-Cash",
    },
  ];

  const current = steps[activeStep] ?? steps[0]!;

  return (
    <section id="workflow" className="relative border-t border-border/60 bg-surface/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3.5 py-1 text-xs font-semibold text-secondary">
            <span>End-to-End Orchestration</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            The Complete Quotation-to-Cash Lifecycle
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Every step is governed by deterministic business logic, connecting sales representatives,
            approvers, customers, warehouse logistics, and finance in one seamless flow.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = idx === activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
                    : "border-border bg-surface/60 text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <div
                  className={`mb-2 flex size-9 items-center justify-center rounded-lg transition-colors ${
                    isSelected ? "bg-primary text-white" : "bg-surface-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <span className="line-clamp-1 text-xs font-bold">{step.title}</span>
                <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {step.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl backdrop-blur-md sm:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Step Info */}
            <div className="space-y-5 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  Step {activeStep + 1} of 6
                </span>
                <span className="rounded-full border border-border bg-surface-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  Role: {current.badge}
                </span>
                <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-0.5 text-xs font-medium text-secondary">
                  {current.kpi}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground">{current.title}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{current.subtitle}</p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {current.summary}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-bold tracking-wider text-foreground uppercase">
                  Key Automated Capabilities:
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {current.details.map((detail, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface-muted/40 p-2.5 text-xs text-muted-foreground"
                    >
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-secondary" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Step Card */}
            <div className="lg:col-span-5">
              <div className="space-y-4 rounded-xl border border-border bg-surface-muted/50 p-5 shadow-inner">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="font-mono text-xs font-semibold text-primary uppercase">
                    Stage Status Machine
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                    <span className="size-2 animate-pulse rounded-full bg-secondary" />
                    Enforced
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between rounded-lg border border-border bg-surface p-2">
                    <span className="text-muted-foreground">Current State:</span>
                    <span className="font-mono font-bold text-foreground uppercase">{current.id}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border border-border bg-surface p-2">
                    <span className="text-muted-foreground">Governing Policy:</span>
                    <span className="font-semibold text-foreground">{current.kpi}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border border-border bg-surface p-2">
                    <span className="text-muted-foreground">Actor Access:</span>
                    <span className="font-semibold text-primary">{current.badge}</span>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                    Audit log auto-records actor, precise timestamp, and change diff into
                    immutable compliance trail.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                    className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ← Previous Step
                  </button>
                  <button
                    type="button"
                    disabled={activeStep === steps.length - 1}
                    onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                    className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-30"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

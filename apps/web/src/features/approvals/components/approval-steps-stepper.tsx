import type { Quotation, QuotationApprovalStep } from "@template/shared";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  Shield,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ApprovalStepsStepperProps {
  quotation: Quotation;
  currentStep: QuotationApprovalStep | null;
}

function getStepTitle(level: string, sequence: number) {
  if (level === "SALES_MANAGER") {
    return `Tier ${sequence}: Sales Manager Review`;
  }
  if (level === "FINANCE") {
    return `Tier ${sequence}: Finance Margin Control`;
  }
  return `Tier ${sequence}: Governance Review`;
}

function getStepDescription(level: string) {
  if (level === "SALES_MANAGER") {
    return "Validates discount requests exceeding customer tier ceilings";
  }
  if (level === "FINANCE") {
    return "Validates low-margin concessions (<25%) and contractual payment terms";
  }
  return "Review required based on governance policy triggers";
}

export function ApprovalStepsStepper({
  quotation,
  currentStep,
}: ApprovalStepsStepperProps) {
  const sortedSteps = [...quotation.approvals].sort(
    (a, b) => a.sequence - b.sequence,
  );

  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Sequential Approval Workflow
          </h3>
        </div>
        <Badge tone="primary" className="text-xs font-semibold">
          {sortedSteps.filter((s) => s.decision === "APPROVED").length} of{" "}
          {sortedSteps.length} Approved
        </Badge>
      </div>

      <div className="relative space-y-8 pl-6 before:absolute before:inset-y-3 before:left-3 before:w-0.5 before:bg-border">
        {sortedSteps.map((step) => {
          const isCurrentActive = currentStep?.id === step.id;
          const isApproved = step.decision === "APPROVED";
          const isRejected = step.decision === "REJECTED";
          const isReturned = step.decision === "RETURNED";
          const isPendingWaiting =
            step.decision === "PENDING" && !isCurrentActive;

          const decidedDateFormatted = step.decidedAt
            ? new Date(step.decidedAt).toLocaleString()
            : null;

          return (
            <div key={step.id} className="relative space-y-2">
              {/* Stepper Node Icon */}
              <div
                className={`bg-card absolute -left-6 flex size-6.5 -translate-x-1/2 items-center justify-center rounded-full border-2 ${
                  isApproved
                    ? "border-success bg-success/10 text-success"
                    : isRejected
                      ? "border-danger bg-danger/10 text-danger"
                      : isReturned
                        ? "border-warning bg-warning/10 text-warning"
                        : isCurrentActive
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border bg-surface-muted text-muted-foreground"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="size-4" />
                ) : isRejected ? (
                  <XCircle className="size-4" />
                ) : isReturned ? (
                  <RotateCcw className="size-3.5" />
                ) : isCurrentActive ? (
                  <Clock className="size-3.5 animate-pulse" />
                ) : (
                  <Lock className="size-3.5" />
                )}
              </div>

              {/* Step Details Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {getStepTitle(step.level, step.sequence)}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {getStepDescription(step.level)}
                  </p>
                </div>

                <div>
                  {isApproved && (
                    <Badge tone="success" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Approved
                    </Badge>
                  )}
                  {isRejected && (
                    <Badge tone="danger" className="gap-1">
                      <AlertCircle className="size-3" />
                      Rejected
                    </Badge>
                  )}
                  {isReturned && (
                    <Badge tone="warning" className="gap-1">
                      <RotateCcw className="size-3" />
                      Returned for Revision
                    </Badge>
                  )}
                  {isCurrentActive && (
                    <Badge tone="primary" className="gap-1 font-semibold">
                      <Clock className="size-3 animate-spin" />
                      Under Active Review
                    </Badge>
                  )}
                  {isPendingWaiting && (
                    <Badge tone="neutral" className="gap-1">
                      <Lock className="size-3" />
                      Waiting for Tier {step.sequence - 1}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Reviewer Note / Decision Audit if decided */}
              {step.reason && (
                <div
                  className={`mt-2 rounded-xl border p-3 text-xs ${
                    isApproved
                      ? "border-success/20 bg-success/5 text-foreground"
                      : isRejected
                        ? "border-danger/20 bg-danger/5 text-foreground"
                        : "border-warning/20 bg-warning/5 text-foreground"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between font-medium">
                    <span>
                      Reviewer Decision Rationale{" "}
                      {step.approverId ? `(${step.approverId})` : ""}
                    </span>
                    {decidedDateFormatted && (
                      <span className="text-muted-foreground">
                        {decidedDateFormatted}
                      </span>
                    )}
                  </div>
                  <p className="italic">{step.reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

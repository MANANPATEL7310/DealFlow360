import { useState } from "react";
import type {
  ApprovalChainRule,
  ApprovalLevel,
  CreateApprovalRuleInput,
} from "@template/shared";
import {
  AlertTriangle,
  GitPullRequest,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApprovalRules,
  useCreateApprovalRule,
  useDeleteApprovalRule,
  useUpdateApprovalRule,
} from "@/features/governance/hooks/use-governance";

interface RuleModalProps {
  initialRule?: ApprovalChainRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateApprovalRuleInput) => void;
  isSaving: boolean;
}

function RuleModalInner({
  initialRule,
  onClose,
  onSave,
  isSaving,
}: Omit<RuleModalProps, "isOpen">) {
  const [name, setName] = useState(initialRule?.name ?? "");
  const [minScore, setMinScore] = useState(
    initialRule?.minScore !== undefined ? initialRule.minScore.toString() : "0.01",
  );
  const [maxScore, setMaxScore] = useState(
    initialRule?.maxScore !== null && initialRule?.maxScore !== undefined
      ? initialRule.maxScore.toString()
      : "",
  );
  const [requiredLevels, setRequiredLevels] = useState<ApprovalLevel[]>(
    initialRule?.requiredLevels ?? ["SALES_MANAGER"],
  );

  const parsedMin = parseFloat(minScore);
  const parsedMax = maxScore.trim() === "" ? null : parseFloat(maxScore);

  const toggleLevel = (lvl: ApprovalLevel) => {
    if (requiredLevels.includes(lvl)) {
      if (requiredLevels.length > 1) {
        setRequiredLevels(requiredLevels.filter((l) => l !== lvl));
      }
    } else {
      setRequiredLevels([...requiredLevels, lvl]);
    }
  };

  const isValid =
    name.trim().length > 0 &&
    !isNaN(parsedMin) &&
    parsedMin >= 0 &&
    (parsedMax === null || (!isNaN(parsedMax) && parsedMax > parsedMin)) &&
    requiredLevels.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSave({
      name: name.trim(),
      minScore: parsedMin,
      maxScore: parsedMax,
      requiredLevels,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="surface-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="size-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              {initialRule ? "Edit Approval Chain Band" : "New Approval Rule"}
            </h3>
          </div>
          <button
            className="rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Rule Band Name
            </label>
            <Input
              className="h-10 w-full px-3 text-sm"
              placeholder="e.g., Small Overage Band, High Risk Multi-Tier"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Min Score (Inclusive)
              </label>
              <Input
                className="h-10 w-full px-3 text-sm"
                min={0}
                required
                step={0.01}
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Score threshold to trigger
              </span>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Max Score (Optional)
              </label>
              <Input
                className="h-10 w-full px-3 text-sm"
                placeholder="Leave blank for ∞"
                step={0.01}
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Empty = uncapped ceiling
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Required Approver Roles
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  requiredLevels.includes("SALES_MANAGER")
                    ? "border-primary/50 bg-primary-light/10"
                    : "border-border hover:bg-surface-muted/50"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Sales Manager
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Direct team supervisor
                  </div>
                </div>
                <input
                  checked={requiredLevels.includes("SALES_MANAGER")}
                  className="rounded border-border text-primary"
                  type="checkbox"
                  onChange={() => toggleLevel("SALES_MANAGER")}
                />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  requiredLevels.includes("FINANCE")
                    ? "border-secondary/50 bg-secondary-light/10"
                    : "border-border hover:bg-surface-muted/50"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Finance Lead
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margin controller
                  </div>
                </div>
                <input
                  checked={requiredLevels.includes("FINANCE")}
                  className="rounded border-border text-secondary"
                  type="checkbox"
                  onChange={() => toggleLevel("FINANCE")}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              disabled={isSaving}
              size="sm"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!isValid || isSaving}
              size="sm"
              type="submit"
              variant="primary"
            >
              {isSaving ? "Saving..." : initialRule ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ApprovalRulesCard() {
  const { data: rules, isLoading } = useApprovalRules();
  const createRule = useCreateApprovalRule();
  const updateRule = useUpdateApprovalRule();
  const deleteRule = useDeleteApprovalRule();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalChainRule | null>(null);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (rule: ApprovalChainRule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingRule(null);
  };

  const handleSave = (data: CreateApprovalRuleInput) => {
    if (editingRule) {
      updateRule.mutate(
        { id: editingRule.id, input: data },
        { onSuccess: handleClose },
      );
    } else {
      createRule.mutate(data, { onSuccess: handleClose });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete approval rule "${name}"? Escalations falling into this band will cascade.`,
      )
    ) {
      deleteRule.mutate(id);
    }
  };

  const isMutating =
    createRule.isPending || updateRule.isPending || deleteRule.isPending;

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <GitPullRequest className="size-4 text-primary" /> Approval Chain
            Rule Engine
          </h2>
          <p className="text-xs text-muted-foreground">
            Maps blended quotation risk scores to mandatory approval
            authorities. Quotations with 0 risk auto-bypass this chain.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={handleOpenAdd}>
          <Plus className="mr-1 size-3.5" /> Add Approval Band
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : rules && rules.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Band Name</TableHead>
              <TableHead>Risk Score Threshold</TableHead>
              <TableHead>Required Approver Chain</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => {
              const hasFinance = rule.requiredLevels.includes("FINANCE");
              return (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-md bg-surface-muted text-foreground">
                        <Shield className="size-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {rule.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      [{rule.minScore.toFixed(2)}
                      {rule.maxScore !== null && rule.maxScore !== undefined
                        ? ` – ${rule.maxScore.toFixed(2)})`
                        : " – ∞ Uncapped)"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rule.requiredLevels.map((lvl) => (
                        <Badge
                          key={lvl}
                          tone={lvl === "FINANCE" ? "secondary" : "primary"}
                        >
                          {lvl === "FINANCE" ? "Finance Lead" : "Sales Manager"}
                        </Badge>
                      ))}
                      {hasFinance && (
                        <span className="inline-flex items-center text-xs text-warning-dark">
                          <AlertTriangle className="mr-0.5 size-3" /> Multi-Tier
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        className="h-8 px-2.5 text-xs"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(rule)}
                      >
                        Edit
                      </Button>
                      <Button
                        className="h-8 px-2.5 text-xs text-danger-dark hover:bg-danger-light/10"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(rule.id, rule.name)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
          No approval rules configured. All quotes exceeding ceiling will require
          default sales manager review.
        </div>
      )}

      {modalOpen && (
        <RuleModalInner
          key={editingRule?.id ?? "new"}
          initialRule={editingRule}
          isSaving={isMutating}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </Card>
  );
}

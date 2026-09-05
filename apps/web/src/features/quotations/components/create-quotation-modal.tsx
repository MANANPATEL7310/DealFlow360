import { useState } from "react";
import type { Customer } from "@template/shared";
import { Building2, FilePlus, Shield, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useCreateQuotation } from "@/features/quotations/hooks/use-quotations";

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quotationId: string) => void;
}

export function CreateQuotationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateQuotationModalProps) {
  const { data: customers = [], isLoading: isCustomersLoading } =
    useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const createMutation = useCreateQuotation();

  if (!isOpen) return null;

  const selectedCustomer: Customer | undefined = customers.find(
    (c) => c.id === selectedCustomerId,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    createMutation.mutate(
      { customerId: selectedCustomerId },
      {
        onSuccess: (newQuote) => {
          onClose();
          onSuccess(newQuote.id);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="surface-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FilePlus className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Initialize New Quotation
              </h3>
              <p className="text-xs text-muted-foreground">
                Select an enterprise account to apply tier pricing schedules.
              </p>
            </div>
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
              Customer Account
            </label>
            {isCustomersLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
            ) : (
              <select
                className="input-shell h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select a customer account...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier} Tier · {c.industry})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCustomer && (
            <div className="space-y-2 rounded-lg border border-border bg-surface-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Partner Standing:
                </span>
                <Badge
                  tone={
                    selectedCustomer.tier === "GOLD"
                      ? "primary"
                      : selectedCustomer.tier === "SILVER"
                        ? "secondary"
                        : "warning"
                  }
                >
                  {selectedCustomer.tier} Tier
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Credit Line:</span>
                <span className="font-mono font-semibold text-foreground">
                  ${(selectedCustomer.creditLimit / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Payment Terms:</span>
                <span className="font-semibold text-foreground">
                  {selectedCustomer.paymentTerms}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
                <Shield className="size-3.5 text-primary" />
                <span>
                  Automatic{" "}
                  {selectedCustomer.tier === "GOLD"
                    ? "15%"
                    : selectedCustomer.tier === "SILVER"
                      ? "10%"
                      : "5%"}{" "}
                  discount ceiling pre-applied.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              disabled={createMutation.isPending}
              size="sm"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedCustomerId || createMutation.isPending}
              size="sm"
              type="submit"
              variant="primary"
            >
              <Building2 className="mr-1.5 size-3.5" />
              {createMutation.isPending ? "Creating..." : "Start Building"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

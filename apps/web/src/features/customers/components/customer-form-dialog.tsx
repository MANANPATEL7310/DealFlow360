import { useState } from "react";
import {
  type CreateCustomerInput,
  type Customer,
  type CustomerTier,
  customerTiers,
} from "@template/shared";
import { Award, Building2, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CustomerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCustomerInput) => void;
  initialCustomer?: Customer | null;
  isPending?: boolean;
}

const PAYMENT_TERMS_OPTIONS = ["Net 30", "Net 45", "Net 60", "Immediate"];

function CustomerFormContent({
  onClose,
  onSubmit,
  initialCustomer,
  isPending,
}: Omit<CustomerFormDialogProps, "isOpen">) {
  const [name, setName] = useState(initialCustomer?.name ?? "");
  const [tier, setTier] = useState<CustomerTier>(
    initialCustomer?.tier ?? "BRONZE",
  );
  const [industry, setIndustry] = useState(initialCustomer?.industry ?? "");
  const [creditLimitDollars, setCreditLimitDollars] = useState(
    initialCustomer ? (initialCustomer.creditLimit / 100).toString() : "250000",
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialCustomer?.paymentTerms ?? "Net 30",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creditNum = parseFloat(creditLimitDollars) || 0;
    if (!name.trim() || !industry.trim() || creditNum < 0) return;

    onSubmit({
      name: name.trim(),
      tier,
      currency: "USD",
      industry: industry.trim(),
      creditLimit: Math.round(creditNum * 100),
      paymentTerms,
    });
  };

  const getTierDescription = (t: CustomerTier) => {
    switch (t) {
      case "GOLD":
        return "Tier 1 ceiling up to 25% • Automated risk pass-through up to $500k";
      case "SILVER":
        return "Tier 1 ceiling up to 15% • Automated risk pass-through up to $250k";
      case "BRONZE":
        return "Standard ceiling up to 8% • Requires manager approval for overrides";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="bg-card relative w-full max-w-lg space-y-6 border-border p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {initialCustomer ? "Edit Enterprise Account" : "Add New Customer"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure account tier, credit ceilings, and billing terms.
            </p>
          </div>
          <button
            className="hover:bg-muted rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="cst-name"
            >
              Enterprise Company Name
            </label>
            <Input
              id="cst-name"
              placeholder="e.g. Acme Global Holdings"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="cst-ind"
            >
              Industry / Sector
            </label>
            <div className="relative">
              <Building2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                id="cst-ind"
                placeholder="e.g. Banking & Financial Services"
                required
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Customer Tier Assignment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {customerTiers.map((t) => {
                const isSelected = tier === t;
                return (
                  <button
                    key={t}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "bg-card/60 border-border hover:border-primary/30"
                    }`}
                    type="button"
                    onClick={() => setTier(t)}
                  >
                    <Award
                      className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="mt-1 text-xs font-bold text-foreground capitalize">
                      {t.toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="bg-muted/40 rounded-lg border border-border/60 p-2 text-xs text-muted-foreground">
              {getTierDescription(tier)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-foreground"
                htmlFor="cst-cred"
              >
                Credit Limit ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  id="cst-cred"
                  min="0"
                  placeholder="500000"
                  required
                  step="1000"
                  type="number"
                  value={creditLimitDollars}
                  onChange={(e) => setCreditLimitDollars(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Payment Terms
              </label>
              <select
                className="bg-card w-full rounded-md border border-border px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                {PAYMENT_TERMS_OPTIONS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              disabled={isPending}
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending
                ? "Saving..."
                : initialCustomer
                  ? "Update Account"
                  : "Create Account"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function CustomerFormDialog(props: CustomerFormDialogProps) {
  if (!props.isOpen) return null;

  return (
    <CustomerFormContent
      key={props.initialCustomer?.id ?? "new"}
      initialCustomer={props.initialCustomer}
      isPending={props.isPending}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}

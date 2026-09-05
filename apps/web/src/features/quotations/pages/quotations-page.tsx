import { useState } from "react";
import { useNavigate } from "react-router";
import { FileSpreadsheet, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateQuotationModal } from "@/features/quotations/components/create-quotation-modal";
import { QuotationsStats } from "@/features/quotations/components/quotations-stats";
import { QuotationsTable } from "@/features/quotations/components/quotations-table";
import { useQuotations } from "@/features/quotations/hooks/use-quotations";

export function QuotationsPage() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: quotations = [], isLoading } = useQuotations();

  const handleCreateSuccess = (quotationId: string) => {
    navigate(`/app/quotations/${quotationId}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quotations & Pipeline
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Construct enterprise proposals, simulate line discount policies, and
            track multi-tier deal approval governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-1.5 size-4" /> Initialize Quotation
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <QuotationsStats isLoading={isLoading} quotations={quotations} />

      {/* Main Quotations Directory Table */}
      <div className="surface-card space-y-4 rounded-xl border border-border p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Quotation Pipeline Portfolio
          </h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-primary" /> Live Risk Evaluator
          </span>
        </div>

        <QuotationsTable isLoading={isLoading} quotations={quotations} />
      </div>

      {/* Create Modal */}
      <CreateQuotationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

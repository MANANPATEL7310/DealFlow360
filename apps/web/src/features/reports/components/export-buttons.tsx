import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { ReportFilters } from "@template/shared";
import { Button } from "@/components/ui/button";
import { useExportReport } from "../hooks/use-reports";

interface ExportButtonsProps {
  filters: ReportFilters;
}

export function ExportButtons({ filters }: ExportButtonsProps) {
  const exportMutation = useExportReport();
  const [activeFormat, setActiveFormat] = useState<"xlsx" | "pdf" | null>(null);

  const handleExport = async (format: "xlsx" | "pdf") => {
    setActiveFormat(format);
    try {
      await exportMutation.mutateAsync({ format, filters });
    } finally {
      setActiveFormat(null);
    }
  };

  const isPending = exportMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("xlsx")}
        disabled={isPending}
        className="h-9 gap-1.5 border-border bg-background text-xs font-semibold shadow-xs hover:bg-surface-muted"
      >
        {activeFormat === "xlsx" ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        <span>Export XLSX</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("pdf")}
        disabled={isPending}
        className="h-9 gap-1.5 border-border bg-background text-xs font-semibold shadow-xs hover:bg-surface-muted"
      >
        {activeFormat === "pdf" ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <FileText className="size-3.5 text-rose-600 dark:text-rose-400" />
        )}
        <span>Export PDF</span>
      </Button>
    </div>
  );
}

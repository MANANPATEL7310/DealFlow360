import type { CreditNote } from "@template/shared";
import { ArrowDownLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreditNotesListProps {
  creditNotes: CreditNote[];
}

export function CreditNotesList({ creditNotes }: CreditNotesListProps) {
  if (!creditNotes || creditNotes.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-white/5 text-slate-400">
          <FileText className="size-5" />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          No credit notes issued for this billing schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <ArrowDownLeft className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Prorated Credit Notes</h4>
            <p className="text-xs text-slate-400">
              Audited adjustments and mid-cycle cancellation credits
            </p>
          </div>
        </div>
        <Badge tone="success" className="border-emerald-500/30 text-xs text-emerald-400">
          {creditNotes.length} Note{creditNotes.length > 1 ? "s" : ""} Issued
        </Badge>
      </div>

      <div className="divide-y divide-white/5">
        {creditNotes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col justify-between gap-2 py-3 text-xs sm:flex-row sm:items-center"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-slate-200">
                  {note.id}
                </span>
                {note.sourceInvoiceId && (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                    Source: {note.sourceInvoiceId}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {note.createdAt.slice(0, 10)}
                </span>
              </div>
              <p className="text-xs text-slate-400">{note.reason}</p>
            </div>
            <div className="flex items-center self-end sm:self-center">
              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-sm font-bold text-emerald-400">
                +${(note.amountMinor / 100).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

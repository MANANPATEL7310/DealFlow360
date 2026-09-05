import {
  Clock,
  Layers,
  MessageSquare,
  Package,
  Sparkles,
} from "lucide-react";
import type {
  NegotiationRequest,
  PortalQuotationLine,
} from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PortalLinesTableProps {
  lines: PortalQuotationLine[];
  negotiations: NegotiationRequest[];
  isLocked: boolean;
  onNegotiateLine: (line: PortalQuotationLine) => void;
}

export function PortalLinesTable({
  lines,
  negotiations,
  isLocked,
  onNegotiateLine,
}: PortalLinesTableProps) {
  // Map lineId -> active/latest negotiation
  const lineNegotiationMap = new Map<string, NegotiationRequest>();
  for (const neg of negotiations) {
    if (neg.lineId) {
      // Keep the most recent or active one
      lineNegotiationMap.set(neg.lineId, neg);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      <div className="flex flex-col gap-1 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Quoted Solutions & Deliverables
          </h2>
          <p className="text-xs text-muted-foreground">
            Itemized breakdown of hardware, recurring subscriptions, and professional services.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="size-4 text-primary" />
          <span>{lines.length} Line Item{lines.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted/60">
              <TableHead className="min-w-48">Product / Service</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right font-bold">Line Total</TableHead>
              {!isLocked && (
                <TableHead className="text-center">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {lines.map((line) => {
              const activeNeg = lineNegotiationMap.get(line.id);
              const formattedUnitPrice = (line.unitPriceMinor / 100).toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              );
              const formattedLineTotal = (line.lineTotalMinor / 100).toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              );

              return (
                <TableRow key={line.id} className="hover:bg-surface-muted/40 transition-colors">
                  {/* Product & Variant info */}
                  <TableCell className="align-top py-4">
                    <div className="space-y-1">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground border border-border">
                          <Package className="size-3.5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {line.productName}
                          </div>
                          {line.variantName && (
                            <div className="text-xs text-muted-foreground font-mono">
                              Spec: {line.variantName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Active negotiation badge if any */}
                      {activeNeg && (
                        <div className="mt-2 ml-9">
                          {activeNeg.status === "ANSWERED" ? (
                            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                              <Sparkles className="size-3" />
                              <span>
                                Counter Concession: {activeNeg.counterDiscountPct}% applied
                              </span>
                            </div>
                          ) : activeNeg.status === "OPEN" ? (
                            <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="size-3" />
                              <span>
                                Counter Request: {activeNeg.counterDiscountPct}% (Awaiting Rep)
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Line Type */}
                  <TableCell className="align-top py-4 text-center">
                    <Badge
                      tone={line.lineType === "RECURRING" ? "primary" : "secondary"}
                      className="text-xs font-medium"
                    >
                      {line.lineType}
                    </Badge>
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="align-top py-4 text-right font-mono font-medium text-foreground">
                    {line.qty}
                  </TableCell>

                  {/* Unit Price */}
                  <TableCell className="align-top py-4 text-right font-mono text-muted-foreground">
                    ${formattedUnitPrice}
                  </TableCell>

                  {/* Discount */}
                  <TableCell className="align-top py-4 text-right font-mono">
                    {line.discountPct > 0 ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {line.discountPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Line Total */}
                  <TableCell className="align-top py-4 text-right font-mono text-sm font-bold text-foreground">
                    ${formattedLineTotal}
                  </TableCell>

                  {/* Action */}
                  {!isLocked && (
                    <TableCell className="align-top py-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNegotiateLine(line)}
                        className="size-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Negotiate pricing or ask a question on this line"
                      >
                        <MessageSquare className="size-4" />
                        <span className="sr-only">Negotiate Line</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

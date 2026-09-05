import type { ReportCategoryContribution } from "@template/shared";
import { Badge } from "@/components/ui/badge";

interface CategoryBreakdownProps {
  categories?: ReportCategoryContribution[];
}

const fmtCurrency = (minor: number) =>
  `$${(minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function CategoryBreakdown({ categories = [] }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return null;
  }

  const totalNet = Math.max(
    1,
    categories.reduce((sum, c) => sum + c.netMinor, 0),
  );

  return (
    <div className="surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border">
        <h3 className="text-base font-bold text-foreground">
          Category Contribution
        </h3>
        <p className="text-xs text-muted-foreground">
          Line-level revenue, unit commitments, and realized margins across
          product lines.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-surface-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-5">Product Category</th>
              <th className="py-3 px-5 text-center">Line Items</th>
              <th className="py-3 px-5 text-right">Gross Total ($)</th>
              <th className="py-3 px-5 text-right">Net Revenue ($)</th>
              <th className="py-3 px-5 text-right">Net Share</th>
              <th className="py-3 px-5 text-right">Margin %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {categories.map((cat) => {
              const netShare = (cat.netMinor / totalNet) * 100;
              const marginTone: "success" | "warning" | "danger" =
                cat.marginPct >= 40
                  ? "success"
                  : cat.marginPct >= 25
                    ? "warning"
                    : "danger";

              return (
                <tr
                  key={cat.categoryId}
                  className="hover:bg-surface-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-5 font-semibold text-foreground">
                    {cat.categoryName}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="font-mono text-muted-foreground">
                      {cat.lineCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-muted-foreground">
                    {fmtCurrency(cat.grossMinor)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-semibold text-foreground">
                    {fmtCurrency(cat.netMinor)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-muted-foreground">
                    {netShare.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Badge tone={marginTone} className="text-xs font-semibold">
                      {cat.marginPct.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

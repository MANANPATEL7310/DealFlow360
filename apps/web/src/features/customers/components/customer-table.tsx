import { type Customer, type CustomerTier } from "@template/shared";
import { Award, Building2, Edit2, Send, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/cn";

interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onOpenContacts: (customer: Customer) => void;
  onGenerateMagicLink: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  canManage?: boolean;
}

export function CustomerTable({
  customers,
  isLoading,
  onOpenContacts,
  onGenerateMagicLink,
  onEditCustomer,
  onDeleteCustomer,
  canManage = false,
}: CustomerTableProps) {
  const pagination = usePagination(customers);
  const formatPrice = (cents: number | null | undefined) =>
    `$${((cents ?? 0) / 100).toLocaleString()}`;

  const getTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case "GOLD":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "SILVER":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "BRONZE":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card space-y-4 rounded-xl border border-border p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border/40 pb-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        description="No customer accounts match your search or tier filter. Clear filters or create a new account."
        icon={Building2}
        title="No Customers Found"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card overflow-x-auto rounded-xl border border-border shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border/80 font-semibold tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-3.5">Company & Industry</th>
              <th className="px-4 py-3.5">Account Tier</th>
              <th className="px-4 py-3.5">Credit Line</th>
              <th className="px-4 py-3.5">Payment Terms</th>
              <th className="px-4 py-3.5 text-center">Contacts</th>
              <th className="px-4 py-3.5 text-center">Portal Negotiation</th>
              {canManage && <th className="px-4 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pagination.pageItems.map((customer) => {
              const primaryContact = customer.contacts[0];

              return (
                <tr
                  key={customer.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {/* Company Name & Industry */}
                  <td className="max-w-xs px-5 py-4">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">
                        {customer.name}
                      </span>
                      <p className="line-clamp-1 text-muted-foreground">
                        {customer.industry}
                      </p>
                      {primaryContact && (
                        <p className="text-xs text-muted-foreground/80">
                          Lead: {primaryContact.name}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Tier Badge */}
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase",
                        getTierBadge(customer.tier),
                      )}
                    >
                      <Award className="size-3" />
                      {customer.tier}
                    </span>
                  </td>

                  {/* Credit Limit */}
                  <td className="p-4 font-bold whitespace-nowrap text-foreground">
                    {formatPrice(customer.creditLimit)}
                  </td>

                  {/* Payment Terms */}
                  <td className="p-4 font-medium whitespace-nowrap text-muted-foreground">
                    {customer.paymentTerms}
                  </td>

                  {/* Contacts Count & Manager */}
                  <td className="p-4 text-center whitespace-nowrap">
                    <button
                      className="bg-card hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
                      type="button"
                      onClick={() => onOpenContacts(customer)}
                    >
                      <Users className="size-3.5 text-primary" />
                      <span>
                        {customer.contacts.length}{" "}
                        {customer.contacts.length === 1
                          ? "Contact"
                          : "Contacts"}
                      </span>
                    </button>
                  </td>

                  {/* Portal Negotiation Magic Link */}
                  <td className="p-4 text-center whitespace-nowrap">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/20"
                      type="button"
                      onClick={() => onGenerateMagicLink(customer)}
                    >
                      <Send className="size-3" />
                      <span>Create Magic Link</span>
                    </button>
                  </td>

                  {/* Admin / Manager Actions */}
                  {canManage && (
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="hover:bg-muted rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                          title="Edit Account"
                          type="button"
                          onClick={() => onEditCustomer(customer)}
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-500/10"
                          title="Delete Account"
                          type="button"
                          onClick={() => onDeleteCustomer(customer)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        pageSize={pagination.pageSize}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        canPrev={pagination.canPrev}
        canNext={pagination.canNext}
        onPrev={pagination.prevPage}
        onNext={pagination.nextPage}
        onPageSizeChange={pagination.setPageSize}
        itemLabel="customer"
      />
    </div>
  );
}

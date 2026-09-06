import { useState } from "react";
import {
  type CreateContactInput,
  type CreateCustomerInput,
  type Customer,
  type CustomerContact,
  type PortalMagicLink,
} from "@template/shared";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerContactsModal } from "@/features/customers/components/customer-contacts-modal";
import {
  type TierFilterType,
  CustomerFilters,
} from "@/features/customers/components/customer-filters";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
import { CustomerStats } from "@/features/customers/components/customer-stats";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { MagicLinkModal } from "@/features/customers/components/magic-link-modal";
import {
  useAddContact,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useGenerateMagicLink,
  useUpdateCustomer,
} from "@/features/customers/hooks/use-customers";
import { useAuthStore } from "@/stores/auth-store";

export function CustomersPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "sales_manager";

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<TierFilterType>("ALL");

  // Modal states
  const [activeContactsCustomer, setActiveContactsCustomer] =
    useState<Customer | null>(null);
  const [activeMagicLink, setActiveMagicLink] =
    useState<PortalMagicLink | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Queries & mutations
  const { data: customers = [], isLoading } = useCustomers({
    query: searchQuery,
    tier: selectedTier,
  });

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();
  const addContactMutation = useAddContact();
  const generateMagicLinkMutation = useGenerateMagicLink();

  const handleCreateOrEditSubmit = (input: CreateCustomerInput) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate(
        { id: editingCustomer.id, input },
        {
          onSuccess: () => {
            setIsCustomerDialogOpen(false);
            setEditingCustomer(null);
          },
        },
      );
    } else {
      createCustomerMutation.mutate(input, {
        onSuccess: () => {
          setIsCustomerDialogOpen(false);
        },
      });
    }
  };

  const handleAddContactSubmit = (input: CreateContactInput) => {
    if (!activeContactsCustomer) return;
    addContactMutation.mutate(
      { customerId: activeContactsCustomer.id, input },
      {
        onSuccess: (newContact) => {
          // Update local view copy in modal
          setActiveContactsCustomer({
            ...activeContactsCustomer,
            contacts: [...activeContactsCustomer.contacts, newContact],
          });
        },
      },
    );
  };

  const handleGenerateMagicLinkForContact = (
    customer: Customer,
    contact: CustomerContact,
  ) => {
    generateMagicLinkMutation.mutate(
      { customerId: customer.id, contactId: contact.id },
      {
        onSuccess: (link) => {
          setActiveMagicLink(link);
        },
      },
    );
  };

  const handleDelete = (customer: Customer) => {
    if (
      window.confirm(
        `Are you sure you want to remove customer account "${customer.name}"?`,
      )
    ) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Customers
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Account tiers, credit lines, payment terms, and portal access.
          </p>
        </div>

        {canManage && (
          <Button
            className="gap-2"
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsCustomerDialogOpen(true);
            }}
          >
            <UserPlus className="size-4" />
            <span>Add customer</span>
          </Button>
        )}
      </div>

      {/* Stats Ribbon */}
      <CustomerStats customers={customers} isLoading={isLoading} />

      {/* Search & Tier Filters */}
      <CustomerFilters
        searchQuery={searchQuery}
        selectedTier={selectedTier}
        onSearchChange={setSearchQuery}
        onTierChange={setSelectedTier}
      />

      {/* High-density Table */}
      <CustomerTable
        canManage={canManage}
        customers={customers}
        isLoading={isLoading}
        onDeleteCustomer={handleDelete}
        onEditCustomer={(c) => {
          setEditingCustomer(c);
          setIsCustomerDialogOpen(true);
        }}
        onGenerateMagicLink={(c) => {
          const firstContact = c.contacts[0];
          if (firstContact) {
            handleGenerateMagicLinkForContact(c, firstContact);
          } else {
            setActiveContactsCustomer(c);
          }
        }}
        onOpenContacts={(c) => setActiveContactsCustomer(c)}
      />

      {/* Contacts Directory Modal */}
      <CustomerContactsModal
        customer={activeContactsCustomer}
        isPending={addContactMutation.isPending}
        isOpen={Boolean(activeContactsCustomer)}
        onAddContact={handleAddContactSubmit}
        onClose={() => setActiveContactsCustomer(null)}
        onGenerateMagicLink={(contact) => {
          if (activeContactsCustomer) {
            handleGenerateMagicLinkForContact(activeContactsCustomer, contact);
          }
        }}
      />

      {/* Portal Negotiation Magic Link Modal */}
      <MagicLinkModal
        isOpen={Boolean(activeMagicLink)}
        magicLink={activeMagicLink}
        onClose={() => setActiveMagicLink(null)}
      />

      {/* Customer Create / Edit Form Dialog */}
      <CustomerFormDialog
        initialCustomer={editingCustomer}
        isPending={
          createCustomerMutation.isPending || updateCustomerMutation.isPending
        }
        isOpen={isCustomerDialogOpen}
        onClose={() => {
          setIsCustomerDialogOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleCreateOrEditSubmit}
      />
    </div>
  );
}

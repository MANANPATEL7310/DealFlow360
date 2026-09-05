import {
  apiRoutes,
  type CreateContactInput,
  type CreateCustomerInput,
  type Customer,
  type CustomerContact,
  type CustomerTier,
  type PortalMagicLink,
  SEED_CUSTOMERS,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

// In-memory customer directory for local evaluation & fallback
let localCustomers: Customer[] = [...SEED_CUSTOMERS];

export interface CustomerFilterParams {
  query?: string;
  tier?: CustomerTier | "ALL";
}

export const customersApi = {
  async getCustomers(params?: CustomerFilterParams): Promise<Customer[]> {
    try {
      const { data } = await apiClient.get(apiRoutes.customers.list.path, {
        params,
      });
      return data.data;
    } catch {
      let results = [...localCustomers];

      if (params?.tier && params.tier !== "ALL") {
        results = results.filter((c) => c.tier === params.tier);
      }

      if (params?.query && params.query.trim().length > 0) {
        const q = params.query.toLowerCase().trim();
        results = results.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.industry.toLowerCase().includes(q) ||
            c.contacts.some(
              (cnt) =>
                cnt.name.toLowerCase().includes(q) ||
                cnt.email.toLowerCase().includes(q),
            ),
        );
      }

      return results;
    }
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.customers.getById.path.replace(":id", id),
      );
      return data.data;
    } catch {
      return localCustomers.find((c) => c.id === id) ?? null;
    }
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.customers.create.path,
        input,
      );
      return data.data;
    } catch {
      const newCustomer: Customer = {
        id: `cst-${Date.now()}`,
        name: input.name,
        tier: input.tier,
        currency: input.currency || "USD",
        industry: input.industry,
        creditLimit: input.creditLimit,
        paymentTerms: input.paymentTerms || "Net 30",
        contacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localCustomers = [newCustomer, ...localCustomers];
      return newCustomer;
    }
  },

  async updateCustomer(
    id: string,
    input: Partial<CreateCustomerInput>,
  ): Promise<Customer> {
    try {
      const { data } = await apiClient.patch(
        apiRoutes.customers.update.path.replace(":id", id),
        input,
      );
      return data.data;
    } catch {
      localCustomers = localCustomers.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          ...input,
          updatedAt: new Date().toISOString(),
        };
      });
      const updated = localCustomers.find((c) => c.id === id);
      if (!updated) throw new Error("Customer account not found");
      return updated;
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      await apiClient.delete(
        apiRoutes.customers.remove.path.replace(":id", id),
      );
    } catch {
      localCustomers = localCustomers.filter((c) => c.id !== id);
    }
  },

  async addContact(
    customerId: string,
    input: CreateContactInput,
  ): Promise<CustomerContact> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.customers.addContact.path.replace(":id", customerId),
        input,
      );
      return data.data;
    } catch {
      const newContact: CustomerContact = {
        id: `cnt-${Date.now()}`,
        customerId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        roleTitle: input.roleTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localCustomers = localCustomers.map((c) => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          contacts: [...c.contacts, newContact],
        };
      });

      return newContact;
    }
  },

  async generateMagicLink(
    customerId: string,
    contactId: string,
  ): Promise<PortalMagicLink> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.customers.magicLink.path.replace(":id", customerId),
        { contactId },
      );
      return data.data;
    } catch {
      const customer = localCustomers.find((c) => c.id === customerId);
      const contact = customer?.contacts.find((cnt) => cnt.id === contactId);
      const token = `magic-${Math.random().toString(36).substring(2, 12)}`;
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      return {
        token,
        url: `/portal/negotiate?token=${token}&cid=${customerId}&email=${encodeURIComponent(contact?.email ?? "")}`,
        expiresAt,
        contactEmail: contact?.email ?? "procurement@customer.com",
        customerName: customer?.name ?? "Enterprise Account",
      };
    }
  },
};

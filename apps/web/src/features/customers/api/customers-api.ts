import {
  apiRoutes,
  type CreateContactInput,
  type CreateCustomerInput,
  type Customer,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export interface CustomerFilterParams {
  tier?: Customer["tier"] | "ALL";
  query?: string;
}

export const customersApi = {
  async getCustomers(params?: CustomerFilterParams): Promise<Customer[]> {
    const { data } = await apiClient.get(apiRoutes.customers.list.path, {
      params,
    });
    return data.data;
  },
  async getCustomerById(id: string): Promise<Customer | null> {
    const { data } = await apiClient.get(
      apiRoutes.customers.getById.path.replace(":id", id),
    );
    return data.data;
  },
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const { data } = await apiClient.post(
      apiRoutes.customers.create.path,
      input,
    );
    return data.data;
  },
  async updateCustomer(
    id: string,
    input: Partial<CreateCustomerInput>,
  ): Promise<Customer> {
    const { data } = await apiClient.patch(
      apiRoutes.customers.update.path.replace(":id", id),
      input,
    );
    return data.data;
  },
  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(apiRoutes.customers.remove.path.replace(":id", id));
  },
  async addContact(customerId: string, input: CreateContactInput) {
    const { data } = await apiClient.post(
      apiRoutes.customers.addContact.path.replace(":id", customerId),
      input,
    );
    return data.data;
  },
  async generateMagicLink(customerId: string, contactId: string) {
    const { data } = await apiClient.post(
      apiRoutes.customers.magicLink.path.replace(":id", customerId),
      { contactId },
    );
    return data.data;
  },
};

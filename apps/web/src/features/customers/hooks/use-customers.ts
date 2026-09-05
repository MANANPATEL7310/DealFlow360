import type { CreateContactInput, CreateCustomerInput } from "@template/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  type CustomerFilterParams,
  customersApi,
} from "@/features/customers/api/customers-api";

export const CUSTOMERS_QUERY_KEY = ["customers"];

export function useCustomers(filters?: CustomerFilterParams) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, filters],
    queryFn: () => customersApi.getCustomers(filters),
    staleTime: 30000,
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, "detail", id],
    queryFn: () => (id ? customersApi.getCustomerById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      customersApi.createCustomer(input),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success(
        `Customer account "${newCustomer.name}" created successfully.`,
      );
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to create customer account.");
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateCustomerInput>;
    }) => customersApi.updateCustomer(id, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success(`Customer "${updated.name}" updated successfully.`);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to update customer account.");
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success("Customer account removed.");
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to delete customer account.");
    },
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      input,
    }: {
      customerId: string;
      input: CreateContactInput;
    }) => customersApi.addContact(customerId, input),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success(`Contact "${newContact.name}" added to customer profile.`);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to add contact.");
    },
  });
}

export function useGenerateMagicLink() {
  return useMutation({
    mutationFn: ({
      customerId,
      contactId,
    }: {
      customerId: string;
      contactId: string;
    }) => customersApi.generateMagicLink(customerId, contactId),
    onSuccess: (link) => {
      toast.success(
        `Generated portal negotiation link for ${link.contactEmail}`,
      );
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to generate portal magic link.");
    },
  });
}

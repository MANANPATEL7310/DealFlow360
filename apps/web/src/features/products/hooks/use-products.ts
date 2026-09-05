import type { CreateProductInput } from "@template/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  type ProductFilterParams,
  productsApi,
} from "@/features/products/api/products-api";

export const PRODUCTS_QUERY_KEY = ["products"];

export function useProducts(filters?: ProductFilterParams) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 30000,
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, "detail", id],
    queryFn: () => (id ? productsApi.getProductById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.createProduct(input),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product "${newProduct.name}" created successfully.`);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to create product.");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateProductInput>;
    }) => productsApi.updateProduct(id, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Product "${updated.name}" updated successfully.`);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to update product.");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Product removed from catalog.");
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to delete product.");
    },
  });
}

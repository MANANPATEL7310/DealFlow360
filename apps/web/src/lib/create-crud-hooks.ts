import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "@/services/http/api-client";

type CrudConfig = {
  /** The API path, e.g. "/products" */
  path: string;
  /** The query key, e.g. "products" */
  key: string;
  /** Display name for toast messages, e.g. "Product" */
  label: string;
};

export function createCrudHooks<TItem, TCreateInput>({
  path,
  key,
  label,
}: CrudConfig) {
  const api = {
    list: () => apiClient.get(path).then((r) => r.data.data),
    getById: (id: string) =>
      apiClient.get(`${path}/${id}`).then((r) => r.data.data),
    create: (data: TCreateInput) =>
      apiClient.post(path, data).then((r) => r.data.data),
    update: (id: string, data: Partial<TCreateInput>) =>
      apiClient.patch(`${path}/${id}`, data).then((r) => r.data.data),
    remove: (id: string) =>
      apiClient.delete(`${path}/${id}`).then((r) => r.data.data),
  };

  function useList() {
    return useQuery<TItem[]>({ queryKey: [key], queryFn: api.list });
  }

  function useById(id: string) {
    return useQuery<TItem>({
      queryKey: [key, id],
      queryFn: () => api.getById(id),
      enabled: !!id,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: api.create,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(`${label} created!`);
      },
      onError: () => toast.error(`Failed to create ${label.toLowerCase()}`),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TCreateInput> }) =>
        api.update(id, data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(`${label} updated!`);
      },
      onError: () => toast.error(`Failed to update ${label.toLowerCase()}`),
    });
  }

  function useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: api.remove,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        toast.success(`${label} deleted!`);
      },
    });
  }

  return { useList, useById, useCreate, useUpdate, useRemove, api };
}

import type {
  CreateApprovalRuleInput,
  DiscountSimulationInput,
  UpdateApprovalRuleInput,
  UpsertCategoryCeilingInput,
  UpsertDiscountTierInput,
} from "@template/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { governanceApi } from "@/features/governance/api/governance-api";

export const GOVERNANCE_QUERY_KEYS = {
  tiers: ["governance", "tiers"] as const,
  ceilings: ["governance", "ceilings"] as const,
  rules: ["governance", "rules"] as const,
};

// ─── Tiers ───────────────────────────────────────────────────────────────────
export function useDiscountTiers() {
  return useQuery({
    queryKey: GOVERNANCE_QUERY_KEYS.tiers,
    queryFn: () => governanceApi.getDiscountTiers(),
    staleTime: 30000,
  });
}

export function useUpsertDiscountTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertDiscountTierInput) =>
      governanceApi.upsertDiscountTier(input),
    onSuccess: (tier) => {
      queryClient.invalidateQueries({ queryKey: GOVERNANCE_QUERY_KEYS.tiers });
      toast.success(
        `Tier ceiling for ${tier.customerTier} set to ${tier.maxDiscountPct}%.`,
      );
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update tier discount ceiling.");
    },
  });
}

// ─── Category Ceilings ───────────────────────────────────────────────────────
export function useCategoryCeilings() {
  return useQuery({
    queryKey: GOVERNANCE_QUERY_KEYS.ceilings,
    queryFn: () => governanceApi.getCategoryCeilings(),
    staleTime: 30000,
  });
}

export function useUpsertCategoryCeiling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertCategoryCeilingInput) =>
      governanceApi.upsertCategoryCeiling(input),
    onSuccess: (ceiling) => {
      queryClient.invalidateQueries({
        queryKey: GOVERNANCE_QUERY_KEYS.ceilings,
      });
      toast.success(
        `Category ceiling for ${ceiling.category} set to ${ceiling.maxDiscountPct}%.`,
      );
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update category ceiling.");
    },
  });
}

// ─── Approval Rules ──────────────────────────────────────────────────────────
export function useApprovalRules() {
  return useQuery({
    queryKey: GOVERNANCE_QUERY_KEYS.rules,
    queryFn: () => governanceApi.getApprovalRules(),
    staleTime: 30000,
  });
}

export function useCreateApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApprovalRuleInput) =>
      governanceApi.createApprovalRule(input),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: GOVERNANCE_QUERY_KEYS.rules });
      toast.success(`Approval rule "${rule.name}" created successfully.`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create approval rule.");
    },
  });
}

export function useUpdateApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateApprovalRuleInput;
    }) => governanceApi.updateApprovalRule(id, input),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: GOVERNANCE_QUERY_KEYS.rules });
      toast.success(`Approval rule "${rule.name}" updated successfully.`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update approval rule.");
    },
  });
}

export function useDeleteApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => governanceApi.deleteApprovalRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOVERNANCE_QUERY_KEYS.rules });
      toast.success("Approval rule deleted successfully.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete approval rule.");
    },
  });
}

// ─── Simulator Hook ──────────────────────────────────────────────────────────
export function useDiscountSimulation() {
  return useMutation({
    mutationFn: (input: DiscountSimulationInput) =>
      governanceApi.simulateDiscount(input),
  });
}

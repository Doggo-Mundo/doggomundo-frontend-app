import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  MembershipPlan,
  MySubscriptionsParams,
  SubscribePayload,
  Subscription,
  SubscriptionCycle,
} from "@/types/membership";

export const membershipKeys = {
  plans: ["membership-plans"] as const,
  subscriptions: {
    all: ["subscriptions"] as const,
    list: (params: Record<string, unknown>) =>
      [...membershipKeys.subscriptions.all, "list", params] as const,
    detail: (id: string) =>
      [...membershipKeys.subscriptions.all, "detail", id] as const,
    cycles: (id: string) =>
      [...membershipKeys.subscriptions.all, "cycles", id] as const,
  },
};

/** Public plan catalog. Backend returns a flat array (no pagination). */
export function useMembershipPlans() {
  return useQuery({
    queryKey: membershipKeys.plans,
    queryFn: () =>
      api.get<MembershipPlan[]>("/memberships/plans/").then((r) => r.data),
  });
}

/** Customer's own subscriptions. Flat array. Default = active + paused. */
export function useMySubscriptions(params: MySubscriptionsParams = {}) {
  return useQuery({
    queryKey: membershipKeys.subscriptions.list(
      params as Record<string, unknown>,
    ),
    queryFn: () =>
      api
        .get<Subscription[]>("/memberships/", { params })
        .then((r) => r.data),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: membershipKeys.subscriptions.detail(id),
    queryFn: () =>
      api.get<Subscription>(`/memberships/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSubscriptionCycles(id: string) {
  return useQuery({
    queryKey: membershipKeys.subscriptions.cycles(id),
    queryFn: () =>
      api
        .get<SubscriptionCycle[]>(`/memberships/${id}/cycles/`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscribePayload) =>
      api
        .post<Subscription>("/memberships/subscribe/", data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: membershipKeys.subscriptions.all });
    },
  });
}

export function useCancelSubscription(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/memberships/${id}/cancel/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: membershipKeys.subscriptions.detail(id),
      });
      qc.invalidateQueries({ queryKey: membershipKeys.subscriptions.all });
    },
  });
}

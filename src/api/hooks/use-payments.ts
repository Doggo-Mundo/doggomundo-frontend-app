import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface SetupIntentResponse {
  client_secret: string;
  setup_intent_id: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[];
}

const paymentMethodsKey = ["payment-methods"] as const;

/**
 * Kick off a SetupIntent on the backend. Returns a client_secret that
 * the Stripe Elements provider uses to mount the PaymentElement.
 *
 * Mutation (not query) because each booking flow needs a fresh
 * SetupIntent — caching across pages would risk reusing a confirmed
 * intent or a stale one.
 */
export function useCreateSetupIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<SetupIntentResponse> => {
      const { data } = await api.post<SetupIntentResponse>(
        "/payments/setup-intent/",
      );
      return data;
    },
    // After a successful SetupIntent + confirm, the new card lives in
    // Stripe. Invalidate the local list so the next render fetches it.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentMethodsKey });
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentMethodsKey,
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data } = await api.get<PaymentMethodsResponse>(
        "/payments/payment-methods/",
      );
      return data.payment_methods;
    },
    staleTime: 30_000,
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pmId: string) => {
      await api.delete(`/payments/payment-methods/${pmId}/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentMethodsKey });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pmId: string) => {
      await api.post(`/payments/payment-methods/${pmId}/set-default/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentMethodsKey });
    },
  });
}

import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface SetupIntentResponse {
  client_secret: string;
  setup_intent_id: string;
}

/**
 * Kick off a SetupIntent on the backend. Returns a client_secret that
 * the Stripe Elements provider uses to mount the PaymentElement.
 *
 * Mutation (not query) because each booking flow needs a fresh
 * SetupIntent — caching across pages would risk reusing a confirmed
 * intent or a stale one.
 */
export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: async (): Promise<SetupIntentResponse> => {
      const { data } = await api.post<SetupIntentResponse>(
        "/payments/setup-intent/",
      );
      return data;
    },
  });
}

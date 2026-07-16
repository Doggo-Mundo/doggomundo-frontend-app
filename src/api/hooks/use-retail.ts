import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  CheckoutOrder,
  CheckoutRequest,
  CheckoutResponse,
  Product,
  ProductCategory,
  ProductListParams,
} from "@/types/retail";

export const retailKeys = {
  categories: ["retail-categories"] as const,
  products: {
    all: ["retail-products"] as const,
    list: (params: Record<string, unknown>) =>
      [...retailKeys.products.all, "list", params] as const,
    detail: (id: string) =>
      [...retailKeys.products.all, "detail", id] as const,
  },
  orders: {
    all: ["retail-orders"] as const,
    detail: (id: string) => [...retailKeys.orders.all, "detail", id] as const,
  },
};

/** Public category list. Flat array. */
export function useProductCategories() {
  return useQuery({
    queryKey: retailKeys.categories,
    queryFn: () =>
      api.get<ProductCategory[]>("/retail/categories/").then((r) => r.data),
  });
}

/** Public product list. Flat array. Accepts `?category=<uuid>`. */
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: retailKeys.products.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<Product[]>("/retail/products/", { params })
        .then((r) => r.data),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: retailKeys.products.detail(id),
    queryFn: () =>
      api.get<Product>(`/retail/products/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

/**
 * Kick off a retail checkout. The backend creates a DRAFT Order,
 * reserves inventory for 15 minutes, and returns a Stripe
 * PaymentIntent client_secret that the caller confirms via
 * `stripe.confirmPayment`.
 *
 * Mutation (not query) — a stale cache here would be dangerous
 * (re-using a confirmed PaymentIntent would fail). Each checkout gets
 * its own fresh call.
 */
export function useRetailCheckout() {
  return useMutation({
    mutationFn: async (body: CheckoutRequest): Promise<CheckoutResponse> => {
      const { data } = await api.post<CheckoutResponse>(
        "/retail/checkout/", body,
      );
      return data;
    },
  });
}

/**
 * Poll a retail Order's server-side state after the customer confirms
 * the payment in Stripe.js. Refetches every 1.5s until status !==
 * "draft" — the webhook lands within a couple seconds in practice, and
 * this cadence stays responsive without hammering the API.
 *
 * `enabled` should be false until the caller has a real order id
 * (avoids a wasted fetch on the initial render of the success page).
 */
export function useRetailOrder(orderId: string | null | undefined) {
  return useQuery({
    queryKey: retailKeys.orders.detail(orderId ?? ""),
    queryFn: async (): Promise<CheckoutOrder> => {
      const { data } = await api.get<CheckoutOrder>(
        `/retail/orders/${orderId}/`,
      );
      return data;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data as CheckoutOrder | undefined;
      // Poll while draft (waiting for webhook); stop once terminal.
      return data && data.status === "draft" ? 1500 : false;
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
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

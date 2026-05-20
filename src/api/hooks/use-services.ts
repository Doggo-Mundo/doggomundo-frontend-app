import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  ServiceCatalogItem,
  ServiceCatalog,
  ServiceListParams,
} from "@/types/service";

export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...serviceKeys.lists(), params] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

export function useServices(params: ServiceListParams = {}) {
  return useQuery({
    queryKey: serviceKeys.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<ServiceCatalogItem>>("/services/catalog/", {
          params,
        })
        .then((r) => r.data),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () =>
      api.get<ServiceCatalog>(`/services/catalog/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

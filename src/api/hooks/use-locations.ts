import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Location,
  LocationListItem,
  LocationListParams,
} from "@/types/location";

export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...locationKeys.lists(), params] as const,
  details: () => [...locationKeys.all, "detail"] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
};

export function useLocations(params: LocationListParams = {}) {
  return useQuery({
    queryKey: locationKeys.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<LocationListItem>>("/locations/", { params })
        .then((r) => r.data),
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () =>
      api.get<Location>(`/locations/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

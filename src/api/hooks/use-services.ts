import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  ServiceCatalogItem,
  ServiceCatalog,
  ServiceListParams,
} from "@/types/service";
import type { GroomingQuote, GroomingQuoteParams } from "@/types/grooming-quote";
import type { GroomingMenu } from "@/types/grooming-menu";

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

/**
 * F-G.4: cotiza un servicio con pricing_mode=size_coat_matrix contra
 * una mascota propia. `params` null (servicio FLAT, o aún sin
 * mascota elegida) deja la query deshabilitada — el wizard sigue
 * usando base_price/base_duration_minutes en ese caso, sin pedir
 * cotización.
 */
export function useGroomingQuote(params: GroomingQuoteParams | null) {
  return useQuery({
    queryKey: ["grooming-quote", params],
    queryFn: () =>
      api
        .get<GroomingQuote>("/services/grooming/quote/", {
          params: {
            service: params!.service,
            pet: params!.pet,
            deluxe: params!.deluxe || undefined,
          },
        })
        .then((r) => r.data),
    enabled: !!params?.service && !!params?.pet,
    retry: false,
  });
}

/**
 * Menú público de grooming de una unidad de negocio: qué incluye cada
 * paquete, rangos de precio/duración por tamaño y pelo, Deluxe y
 * extras. `businessUnitId` null deja la query deshabilitada (ej. la
 * unidad no tiene servicios de calculadora).
 */
export function useGroomingMenu(businessUnitId: string | null) {
  return useQuery({
    queryKey: ["grooming-menu", businessUnitId],
    queryFn: () =>
      api
        .get<GroomingMenu>("/services/grooming/menu/", {
          params: { business_unit: businessUnitId },
        })
        .then((r) => r.data),
    enabled: !!businessUnitId,
    staleTime: 5 * 60 * 1000,
  });
}

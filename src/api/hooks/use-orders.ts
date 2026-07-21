import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Order,
  OrderListItem,
  OrderListParams,
} from "@/types/order";

/** Page size del historial de órdenes del cliente. Móvil-first:
 *  10 rows por página + botón "Cargar más" mantiene el scroll
 *  ligero en devices modestos y no obliga a paginar 3 pantallas
 *  antes de encontrar la orden más reciente. */
const ORDERS_PAGE_SIZE = 10;

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

/**
 * Historial paginado de órdenes del cliente autenticado.
 *
 * Devuelve un `useInfiniteQuery` — el consumer llama
 * `fetchNextPage()` cuando el usuario click "Cargar más" y las
 * páginas se acumulan en `data.pages`. `hasNextPage` es true
 * mientras el backend devuelva `next != null`, así que el botón
 * "Cargar más" se auto-oculta cuando llegamos al final del
 * historial.
 */
export function useMyOrders(params: OrderListParams = {}) {
  return useInfiniteQuery({
    queryKey: orderKeys.list(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PaginatedResponse<OrderListItem>>("/orders/", {
          params: {
            ...params,
            page: pageParam,
            page_size: ORDERS_PAGE_SIZE,
          },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage, allPages) =>
      // DRF PageNumberPagination devuelve `next` como URL absoluta
      // (o null en la última página). Con `next != null` sabemos
      // que hay más y el próximo pageParam es simplemente el
      // siguiente número — evita parsear la URL del backend.
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api.get<Order>(`/orders/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

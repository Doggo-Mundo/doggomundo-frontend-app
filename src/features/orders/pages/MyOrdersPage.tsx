import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyShoppingIllustration } from "@/components/shared/illustrations/EmptyShoppingIllustration";
import { OrderListSkeleton } from "@/components/shared/skeletons/OrderCardSkeleton";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { useMyOrders } from "@/api/hooks/use-orders";
import { usePets } from "@/api/hooks/use-pets";

export function MyOrdersPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyOrders();
  const { data: petsData } = usePets();

  const petNames = useMemo(() => {
    const map = new Map<string, string>();
    (petsData?.results ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [petsData]);

  // Aplana páginas del infinite query en una sola lista para render.
  // Reordenar / dedupe no hace falta: cada página del backend viene
  // ordenada por -created_at y sin solapamientos (page_size fijo).
  const orders = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mis órdenes</h1>
        <p className="text-sm text-muted-foreground">
          Historial de tus servicios y compras.
        </p>
      </header>

      {isLoading ? (
        <OrderListSkeleton rows={3} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar tus órdenes" />
      ) : orders.length === 0 ? (
        <EmptyState
          illustration={<EmptyShoppingIllustration />}
          title="Aún no tienes órdenes"
          description="Cuando completes un servicio o compra, aparecerá aquí."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard
                  order={order}
                  petName={
                    order.pet ? petNames.get(order.pet) ?? null : null
                  }
                />
              </li>
            ))}
          </ul>
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Cargando…" : "Cargar más"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

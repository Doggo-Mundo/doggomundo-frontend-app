import { useMemo } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyShoppingIllustration } from "@/components/shared/illustrations/EmptyShoppingIllustration";
import { OrderListSkeleton } from "@/components/shared/skeletons/OrderCardSkeleton";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { useMyOrders } from "@/api/hooks/use-orders";
import { usePets } from "@/api/hooks/use-pets";

export function MyOrdersPage() {
  const { data, isLoading, isError } = useMyOrders();
  const { data: petsData } = usePets();

  const petNames = useMemo(() => {
    const map = new Map<string, string>();
    (petsData?.results ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [petsData]);

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
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          illustration={<EmptyShoppingIllustration />}
          title="Aún no tienes órdenes"
          description="Cuando completes un servicio o compra, aparecerá aquí."
        />
      ) : (
        <ul className="space-y-3">
          {data.results.map((order) => (
            <li key={order.id}>
              <OrderCard
                order={order}
                petName={order.pet ? petNames.get(order.pet) ?? null : null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

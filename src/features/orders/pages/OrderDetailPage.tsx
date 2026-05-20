import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  PawPrint,
  Receipt,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackLink } from "@/features/pets/components/BackLink";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatMoney } from "@/features/orders/lib/format-money";
import { useOrder } from "@/api/hooks/use-orders";
import { usePets } from "@/api/hooks/use-pets";
import { formatDateTime } from "@/lib/format-date";
import { ORDER_LINE_TYPE_LABEL } from "@/types/order";

interface TotalRowProps {
  label: string;
  amount: string;
  currency: string;
  emphasis?: boolean;
}

function TotalRow({ label, amount, currency, emphasis }: TotalRowProps) {
  return (
    <div
      className={
        "flex justify-between py-1 text-sm " +
        (emphasis ? "font-semibold text-foreground" : "text-muted-foreground")
      }
    >
      <span>{label}</span>
      <span>{formatMoney(amount, currency)}</span>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrder(id ?? "");
  const { data: petsData } = usePets();

  const petName = useMemo(() => {
    if (!order?.pet) return null;
    return petsData?.results.find((p) => p.id === order.pet)?.name ?? null;
  }, [order, petsData]);

  if (!id) return <Navigate to="/my/orders" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/my/orders" label="Mis órdenes" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <BackLink to="/my/orders" label="Mis órdenes" />
        <EmptyState title="No pudimos cargar esta orden" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink to="/my/orders" label="Mis órdenes" />

      <header className="space-y-2">
        <OrderStatusBadge status={order.status} />
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          {formatMoney(order.total, order.currency)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {order.paid_at
            ? `Pagada el ${formatDateTime(order.paid_at)}`
            : `Creada el ${formatDateTime(order.created_at)}`}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {order.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin conceptos.</p>
          ) : (
            <ul className="space-y-2">
              {order.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {line.description_snapshot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ORDER_LINE_TYPE_LABEL[line.line_type]}
                      {Number(line.quantity) > 1 && ` · ${line.quantity}×`}
                      {" · "}
                      {formatMoney(line.unit_price, order.currency)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">
                    {formatMoney(line.line_total, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totales</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TotalRow
            label="Subtotal"
            amount={order.subtotal}
            currency={order.currency}
          />
          {Number(order.discounts_total) > 0 && (
            <TotalRow
              label="Descuentos"
              amount={`-${order.discounts_total}`}
              currency={order.currency}
            />
          )}
          {Number(order.tax_total) > 0 && (
            <TotalRow
              label="Impuestos"
              amount={order.tax_total}
              currency={order.currency}
            />
          )}
          <div className="mt-1 border-t pt-1">
            <TotalRow
              label="Total"
              amount={order.total}
              currency={order.currency}
              emphasis
            />
          </div>
        </CardContent>
      </Card>

      {(order.appointment || petName) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asociado a</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {order.appointment && (
              <Link
                to={`/my/appointments/${order.appointment}`}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Ver la cita relacionada</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
            {petName && order.pet && (
              <Link
                to={`/pets/${order.pet}`}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <PawPrint className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{petName}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm whitespace-pre-line">
            {order.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

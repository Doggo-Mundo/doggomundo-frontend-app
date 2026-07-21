import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Crown, PawPrint, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatMoney } from "@/features/orders/lib/format-money";
import { formatDate } from "@/lib/format-date";
import type { OrderListItem } from "@/types/order";

interface Props {
  order: OrderListItem;
  petName?: string | null;
}

/**
 * F-fix: cuando la orden tiene coverage de membresía, el precio
 * mostrado es lo que efectivamente se cobró — no el sticker price.
 * El sticker se muestra tachado abajo cuando aplica, con un chip
 * "Cubierto por membresía" o "Membresía + tarjeta" según el caso.
 * Sin esto, el cliente ve $350 y no entiende cómo fue cargado.
 */
export function OrderCard({ order, petName }: Props) {
  const coverage = order.membership_coverage;
  const isFullyCovered = coverage?.is_fully_covered;
  const isPartiallyCovered = coverage?.is_partially_covered;
  const membershipDiscount = Number(coverage?.covered_total_mxn ?? 0);
  // Ver OrderDetailPage: charged_total_mxn viene del Payment ledger
  // y es 0 para orders pendientes (aún no cobradas). Para que la
  // tarjeta muestre lo que efectivamente le van a cobrar al cliente
  // usamos total - coverage cuando la orden aún no está paid.
  const chargedFromLedger = Number(order.charged_total_mxn ?? 0);
  const netAmount =
    order.status === "paid"
      ? chargedFromLedger
      : Number(order.total) - membershipDiscount;
  const displaysAsNoCharge = isFullyCovered || netAmount <= 0;
  const stickerDiffers = netAmount !== Number(order.total);

  return (
    <Link
      to={`/my/orders/${order.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3 px-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <p className="flex items-center gap-1.5 font-medium">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  {displaysAsNoCharge
                    ? "Sin cargo"
                    : formatMoney(netAmount.toFixed(2), order.currency)}
                </p>
                {stickerDiffers && !displaysAsNoCharge && (
                  <p className="text-[11px] text-muted-foreground">
                    De un total de{" "}
                    <span className="line-through">
                      {formatMoney(order.total, order.currency)}
                    </span>
                  </p>
                )}
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            {(isFullyCovered || isPartiallyCovered) && (
              <p className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                <Crown className="h-3 w-3" />
                {isFullyCovered
                  ? "Cubierto por tu membresía"
                  // F-D: no asumir tarjeta cuando la orden se cerró
                  // con efectivo o TPV. Solo mencionamos el método
                  // extra si es un tipo conocido; sino "Membresía +
                  // otro pago" para el edge de datos incompletos.
                  : order.effective_payment_method === "cash"
                    ? "Membresía + efectivo"
                    : order.effective_payment_method === "external_terminal"
                      ? "Membresía + TPV"
                      : order.effective_payment_method === "transfer"
                        ? "Membresía + transferencia"
                        : "Membresía + tarjeta"}
              </p>
            )}
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {order.paid_at
                ? `Pagada el ${formatDate(order.paid_at)}`
                : `Creada el ${formatDate(order.created_at)}`}
            </p>
            {petName && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <PawPrint className="h-3 w-3" />
                {petName}
              </p>
            )}
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}

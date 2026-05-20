import { Link } from "react-router-dom";
import { Calendar, ChevronRight, PawPrint, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatMoney } from "@/features/orders/lib/format-money";
import { formatDate } from "@/lib/format-date";
import type { OrderListItem } from "@/types/order";

interface Props {
  order: OrderListItem;
  petName?: string | null;
}

export function OrderCard({ order, petName }: Props) {
  return (
    <Link
      to={`/my/orders/${order.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3 px-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 font-medium">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                {formatMoney(order.total, order.currency)}
              </p>
              <OrderStatusBadge status={order.status} />
            </div>
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

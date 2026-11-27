import { cn } from "@/lib/utils";
import type { PickupStatus } from "@/types/retail";

type ActivePickupStatus = Exclude<PickupStatus, "">;

const LABEL: Record<ActivePickupStatus, string> = {
  pending: "Por preparar",
  ready: "Listo para recoger",
  picked_up: "Entregado",
};

// "Listo para recoger" es lo único que pide acción del cliente → verde.
const VARIANT: Record<ActivePickupStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
  picked_up: "bg-muted text-muted-foreground",
};

interface Props {
  status: PickupStatus;
  /** `pickup_status_display` del backend; si viene vacío usamos el
   *  label local. */
  label?: string;
  className?: string;
}

/** Estado de un pedido de la tienda para recoger en sucursal. No
 *  renderiza nada para órdenes que no son de recoger (status ""). */
export function PickupStatusBadge({ status, label, className }: Props) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        VARIANT[status],
        className,
      )}
    >
      {label || LABEL[status]}
    </span>
  );
}

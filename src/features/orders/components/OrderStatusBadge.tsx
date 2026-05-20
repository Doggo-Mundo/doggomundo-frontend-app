import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/types/order";

const VARIANT: Record<OrderStatus, string> = {
  draft: "bg-accent/15 text-accent-foreground",
  paid: "bg-primary/15 text-primary",
  void: "bg-destructive/10 text-destructive",
};

interface Props {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        VARIANT[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

import { cn } from "@/lib/utils";
import {
  SUBSCRIPTION_STATUS_LABEL,
  type SubscriptionStatus,
} from "@/types/membership";

const VARIANT: Record<SubscriptionStatus, string> = {
  active: "bg-primary/15 text-primary",
  paused: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  past_due: "bg-destructive/10 text-destructive",
};

interface Props {
  status: SubscriptionStatus;
  className?: string;
}

export function SubscriptionStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        VARIANT[status],
        className,
      )}
    >
      {SUBSCRIPTION_STATUS_LABEL[status]}
    </span>
  );
}

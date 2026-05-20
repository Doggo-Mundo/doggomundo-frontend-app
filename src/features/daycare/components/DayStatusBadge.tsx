import { cn } from "@/lib/utils";
import type { DayStatus } from "@/types/daycare";

const VARIANT: Record<DayStatus, string> = {
  scheduled: "bg-accent/15 text-accent-foreground",
  checked_in: "bg-primary/15 text-primary",
  checked_out: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
};

interface Props {
  status: DayStatus;
  /** Backend-provided localized label (status_display). */
  label: string;
  className?: string;
}

export function DayStatusBadge({ status, label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        VARIANT[status],
        className,
      )}
    >
      {label}
    </span>
  );
}

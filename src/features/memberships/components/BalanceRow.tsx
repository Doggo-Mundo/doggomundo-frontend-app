import { Progress } from "@/components/ui/progress";
import type { EntitlementBalance } from "@/types/membership";

interface Props {
  balance: EntitlementBalance;
}

export function BalanceRow({ balance }: Props) {
  const total = balance.included_qty;
  const used = balance.used_qty;
  const remaining = balance.remaining_qty;
  const percent = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{balance.service_name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {remaining} de {total} disponibles
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

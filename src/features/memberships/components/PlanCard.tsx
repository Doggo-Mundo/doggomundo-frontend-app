import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/features/orders/lib/format-money";
import {
  BILLING_INTERVAL_LABEL,
  type MembershipPlan,
} from "@/types/membership";

interface Props {
  plan: MembershipPlan;
}

export function PlanCard({ plan }: Props) {
  return (
    <Link
      to={`/memberships/subscribe/${plan.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold">
                {formatMoney(plan.price_monthly)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {BILLING_INTERVAL_LABEL[plan.billing_interval]}
              </p>
            </div>
          </div>

          {plan.entitlements.length > 0 && (
            <ul className="space-y-1 text-sm">
              {plan.entitlements.map((e) => (
                <li
                  key={e.service}
                  className="flex items-start gap-2 text-muted-foreground"
                >
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                  <span>
                    {e.quantity_per_cycle}× {e.service_name}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-end gap-1 pt-1 text-sm font-medium text-primary">
            Ver más
            <ChevronRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

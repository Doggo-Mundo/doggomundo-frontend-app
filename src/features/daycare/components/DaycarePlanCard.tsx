import { Link } from "react-router-dom";
import { ChevronRight, Clock, Infinity as InfinityIcon, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/features/orders/lib/format-money";
import type { DaycarePlan } from "@/types/daycare";

interface Props {
  plan: DaycarePlan;
}

export function DaycarePlanCard({ plan }: Props) {
  const isUnlimited = plan.credits_included === null;

  return (
    <Link
      to={`/daycare/plans/${plan.id}/enroll`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {plan.plan_type_display}
              </p>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold">{formatMoney(plan.price)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {isUnlimited ? (
                <>
                  <InfinityIcon className="h-3.5 w-3.5" />
                  Visitas ilimitadas
                </>
              ) : (
                <>
                  <Ticket className="h-3.5 w-3.5" />
                  {plan.credits_included}{" "}
                  {plan.credits_included === 1 ? "visita" : "visitas"}
                </>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {plan.validity_days}{" "}
              {plan.validity_days === 1 ? "día" : "días"} de vigencia
            </span>
          </div>

          <div className="mt-auto flex items-center justify-end gap-1 text-sm font-medium text-primary">
            Inscribir
            <ChevronRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

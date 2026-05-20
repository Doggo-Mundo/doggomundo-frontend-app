import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";
import { formatDate } from "@/lib/format-date";
import type { Subscription } from "@/types/membership";

interface Props {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: Props) {
  return (
    <Link
      to={`/my/subscriptions/${subscription.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3 px-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-medium">{subscription.plan_name}</p>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Vigente hasta {formatDate(subscription.current_period_end)}
            </p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
